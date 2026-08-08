import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

const TRANSPORT_PROMPT = `Extract transportation booking details from this document.
Return ONLY valid JSON with exactly these fields (use null for any field not found):
- type (string, one of: "CAR_RENTAL", "BUS", "TRAIN", "SHUTTLE", "TAXI", "PRIVATE_DRIVER". Pick the closest match.)
- date (string YYYY-MM-DD or null)
- fromLocation (string, pickup/departure location or null)
- toLocation (string, destination/dropoff location or null)
- departureTime (string HH:MM or null)
- arrivalTime (string HH:MM or null)
- company (string, company/operator name or null)
- reference (string, booking/confirmation number or null)
- vehicle (string, car model or type or null)
- contactName (string or null)
- contactPhone (string or null)
- notes (string, any extra info, or null)`;

type Params = { params: Promise<{ id: string }> };

export async function POST(_req: NextRequest, { params }: Params) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: tripId } = await params;
  const key = process.env.GOOGLE_GEMINI_API_KEY;
  if (!key) return NextResponse.json({ error: "API key missing" }, { status: 500 });

  // Fetch all documents for this trip that could contain transport info
  const docs = await prisma.document.findMany({
    where: { tripId },
    select: { id: true, fileData: true, fileType: true, originalName: true, tag: true },
  });

  if (docs.length === 0) {
    return NextResponse.json({ added: 0, message: "אין מסמכים בטיול זה" });
  }

  let added = 0;
  const errors: string[] = [];

  for (const doc of docs) {
    if (!doc.fileData) continue;

    const bytes = Buffer.from(doc.fileData);
    const mimeType = doc.fileType || "application/pdf";

    let parts: any[] = [];

    const isWordDoc =
      mimeType.includes("word") ||
      mimeType.includes("officedocument") ||
      doc.originalName?.endsWith(".docx") ||
      doc.originalName?.endsWith(".doc");

    const isText = mimeType.includes("text/") || doc.originalName?.endsWith(".txt");

    try {
      if (isWordDoc) {
        // Dynamic import to avoid edge runtime issues
        const mammoth = await import("mammoth");
        const extracted = await mammoth.extractRawText({ buffer: bytes });
        const documentText = extracted.value || "";
        if (!documentText.trim()) continue;
        parts = [{ text: `Document content:\n${documentText}\n\n${TRANSPORT_PROMPT}` }];
      } else if (isText) {
        const documentText = bytes.toString("utf-8");
        parts = [{ text: `Document content:\n${documentText}\n\n${TRANSPORT_PROMPT}` }];
      } else {
        const b64 = bytes.toString("base64");
        const safeMime = mimeType && mimeType.includes("/") ? mimeType : "application/pdf";
        parts = [
          { inlineData: { mimeType: safeMime, data: b64 } },
          { text: TRANSPORT_PROMPT },
        ];
      }

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts }],
            generationConfig: { temperature: 0.1, responseMimeType: "application/json" },
          }),
        }
      );

      if (!res.ok) continue;

      const json = await res.json();
      const rawText =
        json?.candidates?.[0]?.content?.parts?.map((p: any) => p.text ?? "").join("") ?? "";

      let parsed: any;
      try {
        parsed = JSON.parse(rawText);
      } catch {
        continue;
      }

      const items = Array.isArray(parsed) ? parsed : [parsed];

      for (const data of items) {
        // Only create if we got at minimum a type or company (avoid empty records)
        if (!data.type && !data.company && !data.fromLocation) continue;

        const resolvedType = [
          "CAR_RENTAL", "BUS", "TRAIN", "SHUTTLE", "TAXI", "PRIVATE_DRIVER"
        ].includes(data.type) ? data.type : "CAR_RENTAL";

        // Check if an identical record already exists (dedup by reference number)
        if (data.reference) {
          const existing = await prisma.transportation.findFirst({
            where: { tripId, reference: data.reference },
          });
          if (existing) continue;
        }

        await prisma.transportation.create({
          data: {
            tripId,
            type: resolvedType,
            date: data.date ? new Date(data.date + "Z") : null,
            fromLocation: data.fromLocation || null,
            toLocation: data.toLocation || null,
            departureTime: data.departureTime || null,
            arrivalTime: data.arrivalTime || null,
            company: data.company || null,
            reference: data.reference || null,
            vehicle: data.vehicle || null,
            contactName: data.contactName || null,
            contactPhone: data.contactPhone || null,
            documents: null,
            notes: data.notes || "חולץ אוטומטית ממסמכי הטיול",
          },
        });
        added++;
      }
    } catch (err: any) {
      errors.push(`${doc.originalName}: ${err.message}`);
    }
  }

  return NextResponse.json({
    added,
    message:
      added > 0
        ? `נמצאו ונוספו ${added} פרטי תחבורה ממסמכי הטיול`
        : "לא נמצאו פרטי תחבורה במסמכים",
    errors: errors.length > 0 ? errors : undefined,
  });
}
