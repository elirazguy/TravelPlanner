import { prisma } from "../src/lib/prisma";
import path from "path";
import { readFile } from "fs/promises";

async function testFlights() {
  const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
  const docs = await prisma.document.findMany({
    where: { tag: "FLIGHT" },
  });

  const key = process.env.GOOGLE_GEMINI_API_KEY;

  for (const doc of docs) {
    console.log(`Processing: ${doc.originalName} (${doc.id})`);
    const filePath = path.join(UPLOAD_DIR, doc.fileName);
    const bytes = await readFile(filePath);
    
    const b64 = bytes.toString("base64");
    const parts = [
      {
        inlineData: {
          mimeType: "application/pdf",
          data: b64,
        },
      },
      { text: `Extract flight booking details from this document.
Return ONLY valid JSON with exactly these fields (use null for any field not found):
- flightNumber (string, e.g. "LY315" or "UA84")
- airline (string, e.g. "El Al" or "United")
- departureAirport (string, e.g. "TLV" or "JFK")
- arrivalAirport (string, e.g. "JFK" or "LHR")
- flightDate (string YYYY-MM-DD or null)
- notes (string)` },
    ];
    
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts }],
          generationConfig: {
            temperature: 0.1,
            responseMimeType: "application/json",
          },
        }),
      }
    );
    const json = await res.json();
    const text = json?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join("");
    console.log(`Response for ${doc.originalName}:`, text);
  }
}

testFlights().catch(console.error);
