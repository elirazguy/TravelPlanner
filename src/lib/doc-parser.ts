import { prisma } from "@/lib/prisma";
import mammoth from "mammoth";
import { searchPlaces } from "@/lib/places";

const HOTEL_PROMPT = `Extract hotel booking details from this document.
Return ONLY valid JSON with exactly these fields (use null for any field not found):
- name (string)
- address (string)
- phone (string)
- website (string)
- confirmationNumber (string)
- checkInDate (string ISO format with BOTH date and EXACT time of check-in, e.g. 2026-10-14T15:00:00 or null)
- checkOutDate (string ISO format with BOTH date and EXACT time of check-out, e.g. 2026-10-18T11:00:00 or null)
- notes (string)`;

const FLIGHT_PROMPT = `Extract flight booking details from this document.
Return ONLY valid JSON with exactly these fields (use null for any field not found):
- flightNumber (string, e.g. "LY315" or "UA84")
- airline (string, e.g. "El Al" or "United")
- departureAirport (string, e.g. "TLV" or "JFK")
- arrivalAirport (string, e.g. "JFK" or "LHR")
- flightDate (string YYYY-MM-DD or null)
- notes (string)`;

export async function processDocumentWithGemini(
  tripId: string,
  tag: string,
  bytes: Buffer,
  mimeType: string,
  originalName?: string
) {
  const key = process.env.GOOGLE_GEMINI_API_KEY;
  if (!key) return;

  // Only auto-extract for HOTEL or FLIGHT tags
  if (tag !== "HOTEL" && tag !== "FLIGHT") return;

  const prompt = tag === "HOTEL" ? HOTEL_PROMPT : FLIGHT_PROMPT;
  const isWordDoc =
    mimeType.includes("word") ||
    mimeType.includes("officedocument") ||
    originalName?.endsWith(".docx") ||
    originalName?.endsWith(".doc");

  const isText = mimeType.includes("text/") || originalName?.endsWith(".txt");

  let parts: any[] = [];

  try {
    if (isWordDoc) {
      // Extract text from Word (.docx / .doc) using mammoth
      const extracted = await mammoth.extractRawText({ buffer: bytes });
      const documentText = extracted.value || "";
      if (!documentText.trim()) return;

      parts = [{ text: `Document content:\n${documentText}\n\n${prompt}` }];
    } else if (isText) {
      const documentText = bytes.toString("utf-8");
      parts = [{ text: `Document content:\n${documentText}\n\n${prompt}` }];
    } else {
      // Images (PNG, JPG) and PDF files via multimodal inlineData
      const b64 = bytes.toString("base64");
      const safeMime = mimeType && mimeType.includes("/") ? mimeType : "application/pdf";
      parts = [
        {
          inlineData: {
            mimeType: safeMime,
            data: b64,
          },
        },
        { text: prompt },
      ];
    }

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

    if (!res.ok) return;

    const json = await res.json();
    const rawText = json?.candidates?.[0]?.content?.parts?.map((p: any) => p.text ?? "").join("") ?? "";
    const parsed = JSON.parse(rawText);

    const parsedData = Array.isArray(parsed) ? parsed : [parsed];

    for (const data of parsedData) {
      if (tag === "HOTEL" && data.name) {
        const checkInStr = data.checkInDate ? (data.checkInDate.endsWith('Z') ? data.checkInDate : data.checkInDate + 'Z') : null;
        const checkOutStr = data.checkOutDate ? (data.checkOutDate.endsWith('Z') ? data.checkOutDate : data.checkOutDate + 'Z') : null;
        const checkIn = checkInStr ? new Date(checkInStr) : null;
        const checkOut = checkOutStr ? new Date(checkOutStr) : null;

        let lat = null;
        let lng = null;
        if (data.name) {
          try {
            const query = `${data.name} ${data.address || ""}`.trim();
            const places = await searchPlaces(query);
            if (places && places.length > 0) {
              lat = places[0].lat;
              lng = places[0].lng;
            }
          } catch (e) {
            console.error("Failed to geocode hotel:", e);
          }
        }

        await prisma.hotel.create({
          data: {
            tripId,
            name: data.name,
            address: data.address || null,
            phone: data.phone || null,
            website: data.website || null,
            confirmationNumber: data.confirmationNumber || null,
            checkInDate: checkIn && !isNaN(checkIn.getTime()) ? checkIn : null,
            checkOutDate: checkOut && !isNaN(checkOut.getTime()) ? checkOut : null,
            lat,
            lng,
            notes: data.notes || "חולץ אוטומטית ממסמכי הטיול",
          },
        });
      } else if (tag === "FLIGHT" && data.flightNumber) {
        const flightDateStr = data.flightDate ? (data.flightDate.endsWith('Z') ? data.flightDate : data.flightDate + 'Z') : null;
        const flightDate = flightDateStr ? new Date(flightDateStr) : new Date();

        const existingFlight = await prisma.flight.findFirst({
          where: {
            tripId,
            flightNumber: data.flightNumber,
          },
        });

        if (!existingFlight) {
          await prisma.flight.create({
            data: {
              tripId,
              flightNumber: data.flightNumber,
              airline: data.airline || null,
              departureAirport: data.departureAirport || null,
              arrivalAirport: data.arrivalAirport || null,
              flightDate: !isNaN(flightDate.getTime()) ? flightDate : new Date(),
              notes: data.notes || "חולץ אוטומטית ממסמכי הטיול",
            },
          });
        }
      }
    }
  } catch (err) {
    console.error("Auto document parsing failed:", err);
  }
}
