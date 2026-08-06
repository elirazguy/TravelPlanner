import { prisma } from "../src/lib/prisma";
import path from "path";
import { readFile } from "fs/promises";

async function testHotels() {
  const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
  const docs = await prisma.document.findMany({
    where: { tag: "HOTEL" },
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
      { text: `Extract hotel booking details from this document.
Return ONLY valid JSON with exactly these fields (use null for any field not found):
- name (string)
- address (string)
- phone (string)
- checkInDate (string ISO format with BOTH date and EXACT time of check-in, e.g. 2026-10-14T15:00:00 or null)
- checkOutDate (string ISO format with BOTH date and EXACT time of check-out, e.g. 2026-10-18T11:00:00 or null)` },
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

testHotels().catch(console.error);
