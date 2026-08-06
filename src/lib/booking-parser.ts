export interface ExtractedBookingDetails {
  hotel_name: string;
  address: string | null;
  check_in: string | null;
  check_out: string | null;
  room_type: string | null;
  total_price: string | null;
  currency: string | null;
  booking_reference: string | null;
}

const EXTRACT_BOOKING_SYSTEM = `You are a precision hotel booking extractor.
You analyze confirmation email text from Booking.com and extract structured booking details.

Return ONLY a valid JSON object matching the requested schema:
- hotel_name: The official name of the hotel/accommodation
- address: Full street address including city/country
- check_in: Check-in date in YYYY-MM-DD format
- check_out: Check-out date in YYYY-MM-DD format
- room_type: Type of room or apartment booked
- total_price: Numeric or formatted total price
- currency: Currency code (e.g. EUR, USD, ILS)
- booking_reference: Confirmation or reservation number (e.g. "4829103921")`;

const SCHEMA = {
  type: "OBJECT",
  properties: {
    hotel_name: { type: "STRING" },
    address: { type: "STRING" },
    check_in: { type: "STRING" },
    check_out: { type: "STRING" },
    room_type: { type: "STRING" },
    total_price: { type: "STRING" },
    currency: { type: "STRING" },
    booking_reference: { type: "STRING" },
  },
  required: ["hotel_name"],
};

export interface TripContext {
  destination: string;
  startDate?: string;
  endDate?: string;
}

export async function parseBookingEmailWithGemini(
  emailSubject: string,
  emailBody: string,
  tripContext?: TripContext
): Promise<ExtractedBookingDetails | null> {
  const key = process.env.GOOGLE_GEMINI_API_KEY;
  if (!key) {
    throw new Error("GOOGLE_GEMINI_API_KEY is missing in .env");
  }

  let contextString = "";
  if (tripContext) {
    contextString = `\nTRIP CONTEXT:\n- Destination: ${tripContext.destination}\n- Expected dates: ${tripContext.startDate || "N/A"} to ${tripContext.endDate || "N/A"}\nIf this email confirmation is for a completely different trip date or location, set hotel_name to null or empty string.`;
  }

  const prompt = `Subject: ${emailSubject}\n\nEmail Content:\n${emailBody}${contextString}`;

  const requestBody = {
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    system_instruction: { parts: [{ text: EXTRACT_BOOKING_SYSTEM }] },
    generationConfig: {
      temperature: 0.1,
      responseMimeType: "application/json",
      responseSchema: SCHEMA,
    },
  };

  const models = ["gemini-2.5-flash", "gemini-flash-latest"];
  let json: any = null;

  for (const model of models) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
        }
      );

      if (res.ok) {
        json = await res.json();
        break;
      }
    } catch {
      // try next model
    }
  }

  if (!json) return null;

  const rawText = json?.candidates?.[0]?.content?.parts?.map((p: any) => p.text ?? "").join("") ?? "";
  if (!rawText) return null;

  try {
    const parsed = JSON.parse(rawText);
    if (!parsed.hotel_name) return null;

    return {
      hotel_name: parsed.hotel_name.trim(),
      address: parsed.address?.trim() || null,
      check_in: parsed.check_in?.trim() || null,
      check_out: parsed.check_out?.trim() || null,
      room_type: parsed.room_type?.trim() || null,
      total_price: parsed.total_price?.trim() || null,
      currency: parsed.currency?.trim() || null,
      booking_reference: parsed.booking_reference?.trim() || null,
    };
  } catch {
    return null;
  }
}
