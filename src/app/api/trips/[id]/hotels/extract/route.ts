import { NextRequest, NextResponse } from "next/server";

const EXTRACT_PROMPT = `Extract hotel booking details from this document.

Return ONLY valid JSON with exactly these fields (use null for any field not found).
Do not include any text outside the JSON object.`;

// POST /api/trips/[id]/hotels/extract
export async function POST(req: NextRequest) {
  const key = process.env.GOOGLE_GEMINI_API_KEY;
  if (!key) {
    return NextResponse.json({ error: "GOOGLE_GEMINI_API_KEY is not set." }, { status: 400 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const b64 = Buffer.from(bytes).toString("base64");
  const mimeType = file.type;

  const requestBody = {
    contents: [
      {
        role: "user",
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: b64,
            },
          },
          { text: EXTRACT_PROMPT },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.1,
      responseMimeType: "application/json",
      responseSchema: {
        type: "OBJECT",
        properties: {
          name: { type: "STRING" },
          address: { type: "STRING" },
          phone: { type: "STRING" },
          website: { type: "STRING" },
          confirmationNumber: { type: "STRING" },
          checkInDate: { type: "STRING" },
          checkOutDate: { type: "STRING" },
          notes: { type: "STRING" }
        }
      }
    },
  };

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      }
    );

    if (!res.ok) {
       const detail = await res.text().catch(() => "");
       throw new Error(`Gemini request failed: ${res.status} ${detail}`);
    }
    
    const json = await res.json();
    const rawText = json?.candidates?.[0]?.content?.parts?.map((p: any) => p.text ?? "").join("") ?? "";
    
    try {
      const parsed = JSON.parse(rawText);
      return NextResponse.json(parsed);
    } catch {
      return NextResponse.json({ error: "Could not parse extracted data", raw: rawText }, { status: 502 });
    }
  } catch (err: any) {
    return NextResponse.json({ error: "Extraction failed", raw: err.message }, { status: 502 });
  }
}
