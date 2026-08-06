// Google Gemini helper for the place-list chat assistant. Uses the same REST
// surface (generativelanguage.googleapis.com/v1beta) already used for cover
// generation. Reads GOOGLE_GEMINI_API_KEY. Multimodal: text + an image.

// Tried in order — the app uses whichever model the key's project actually
// exposes under v1beta. A 404 ("model not found / not supported") falls through
// to the next; any other error (e.g. quota) stops the chain immediately.
const GEMINI_MODELS = [
  "gemini-2.5-flash",
  "gemini-flash-latest",
];

export interface ChatTurn {
  role: "user" | "model";
  text: string;
}

export interface ExtractedPlace {
  name: string;
  category: "HOTEL" | "ATTRACTION" | "ACTIVITY" | "FOOD" | "OTHER";
  note?: string;
}

export interface PlaceChatResult {
  reply: string;
  places: ExtractedPlace[];
}

const SYSTEM_INSTRUCTION = (destination: string) =>
  `You help a traveler build a list of places they want to visit on a trip to ${destination}.
The user will give you place names by typing, by sharing a screenshot (e.g. a Google Maps list of restaurants), or by pasting captions from Instagram Reels / TikTok videos.

Your job:
- Extract every concrete, real place the user wants to visit (restaurants, cafés, bars, hotels, attractions, parks, shops, experiences). Use the place's proper name.
- When the input is an image of a places list, read ALL the places in it.
- When the input is a social-media caption, pull out the specific venue names mentioned (ignore generic hashtags and filler).
- Classify each place into one of: HOTEL, FOOD, ATTRACTION, ACTIVITY, OTHER.
- If the user is just chatting or you cannot find any place, return an empty places array and a short helpful reply.

Always write the "reply" field in Hebrew, friendly and concise. Mention how many places you found.`;

const RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    reply: { type: "STRING" },
    places: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          name: { type: "STRING" },
          // One of HOTEL | ATTRACTION | ACTIVITY | FOOD | OTHER. Kept as a plain
          // string (not a schema enum) for broad API compatibility; validated
          // and coerced server-side after parsing.
          category: { type: "STRING" },
          note: { type: "STRING" },
        },
        required: ["name", "category"],
      },
    },
  },
  required: ["reply", "places"],
};

// Ask Gemini for the single most iconic, photogenic subject to use as a trip
// cover photo for a destination, optionally biased by the traveler's stated
// style/notes. Returns an English place name (to feed Google Places Photos).
export async function pickCoverSubject(
  destination: string,
  notes?: string
): Promise<string | null> {
  const key = process.env.GOOGLE_GEMINI_API_KEY;
  if (!key) return null;
  const prompt =
    notes && notes.trim()
      ? `You are picking a real photo subject from Google Maps for a trip cover image.
Destination: "${destination}".
The traveler's desired vibe / style for THIS trip: "${notes.trim()}".

Name ONE real, specific, photogenic place, viewpoint, beach, harbor, marina, market, trail or scenic spot IN this destination whose photos best capture that vibe. The vibe is the priority — do NOT default to a famous historic monument unless it genuinely fits the vibe. For example: "sailing/yacht between islands" -> a marina or a caldera/bay viewpoint over the sea with boats; "beaches" -> a famous beach; "food" -> a food market; "hiking/nature" -> a national park or trail.
Reply with ONLY the place name and its city/region in English, nothing else.`
      : `For a travel cover photo of "${destination}", name the single most iconic, recognizable, photogenic landmark or view. Reply with ONLY that place name in English (e.g. "Eiffel Tower, Paris"). No other words.`;

  const body = JSON.stringify({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.5, maxOutputTokens: 40 },
  });

  for (const model of GEMINI_MODELS) {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
      { method: "POST", headers: { "Content-Type": "application/json" }, body }
    ).catch(() => null);
    if (!res) return null;
    if (res.ok) {
      const j = await res.json();
      const t: string =
        j?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? "").join("").trim() ?? "";
      return t || null;
    }
    if (res.status !== 404) return null; // non-404 → stop (e.g. quota)
  }
  return null;
}

// Generate a beautiful, style-aware trip cover image with AI. Tries Imagen
// models first (best quality), then Gemini image-generation models. Returns
// base64 image data, or null if generation isn't available on this key.
const COVER_IMAGEN_MODELS = ["imagen-4.0-generate-001", "imagen-3.0-generate-002"];
const COVER_GEMINI_IMAGE_MODELS = [
  "gemini-2.5-flash-image-preview",
  "gemini-2.0-flash-preview-image-generation",
];

export async function generateCoverImage(
  destination: string,
  notes?: string
): Promise<{ base64: string; mime: string } | null> {
  const key = process.env.GOOGLE_GEMINI_API_KEY;
  if (!key) return null;
  const prompt = `A breathtaking, high-quality travel cover photograph representing ${destination}.${
    notes && notes.trim() ? ` The trip's theme and style: ${notes.trim()}.` : ""
  } Cinematic, vibrant colors, beautiful natural lighting, photorealistic, wide landscape composition, no text, no watermark, no logo.`;

  const base = "https://generativelanguage.googleapis.com/v1beta/models";

  // Imagen (predict) — highest quality.
  for (const model of COVER_IMAGEN_MODELS) {
    try {
      const res = await fetch(`${base}/${model}:predict?key=${key}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instances: [{ prompt }],
          parameters: { sampleCount: 1, aspectRatio: "16:9" },
        }),
      });
      if (res.ok) {
        const j = await res.json();
        const pred = j?.predictions?.[0];
        if (pred?.bytesBase64Encoded) {
          return { base64: pred.bytesBase64Encoded, mime: pred.mimeType ?? "image/png" };
        }
      }
    } catch {
      // try next model
    }
  }

  // Gemini image generation.
  for (const model of COVER_GEMINI_IMAGE_MODELS) {
    try {
      const res = await fetch(`${base}/${model}:generateContent?key=${key}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseModalities: ["IMAGE"] },
        }),
      });
      if (res.ok) {
        const j = await res.json();
        const part = j?.candidates?.[0]?.content?.parts?.find(
          (p: { inlineData?: { data: string; mimeType?: string } }) => p.inlineData
        );
        if (part?.inlineData?.data) {
          return { base64: part.inlineData.data, mime: part.inlineData.mimeType ?? "image/png" };
        }
      }
    } catch {
      // try next model
    }
  }

  return null;
}

export async function runPlaceChat(opts: {
  destination: string;
  history: ChatTurn[];
  userText: string;
  imageBase64?: string;
  imageMime?: string;
  captions?: string[];
}): Promise<PlaceChatResult> {
  const key = process.env.GOOGLE_GEMINI_API_KEY;
  if (!key) {
    throw new Error("GOOGLE_GEMINI_API_KEY is not set. Add it to your .env to enable the place chat.");
  }

  // Build the current user turn: text + optional fetched captions + optional image.
  const parts: Record<string, unknown>[] = [];
  let text = opts.userText || "";
  if (opts.captions && opts.captions.length > 0) {
    text +=
      "\n\n[Text pulled from the shared link(s):]\n" +
      opts.captions.map((c) => `"""${c}"""`).join("\n\n");
  }
  if (text.trim()) parts.push({ text: text.trim() });
  if (opts.imageBase64) {
    parts.push({
      inlineData: {
        mimeType: opts.imageMime || "image/jpeg",
        data: opts.imageBase64,
      },
    });
  }
  if (parts.length === 0) parts.push({ text: "(empty)" });

  // Gemini requires the conversation to begin with a 'user' turn — drop any
  // leading model turns (e.g. the UI's opening greeting) from the history.
  const trimmedHistory = [...opts.history];
  while (trimmedHistory.length > 0 && trimmedHistory[0].role === "model") {
    trimmedHistory.shift();
  }

  const contents = [
    ...trimmedHistory.map((t) => ({ role: t.role, parts: [{ text: t.text }] })),
    { role: "user", parts },
  ];

  const requestBody = JSON.stringify({
    contents,
    system_instruction: {
      parts: [{ text: SYSTEM_INSTRUCTION(opts.destination) }],
    },
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: RESPONSE_SCHEMA,
      temperature: 0.3,
    },
  });

  // Try models in order; fall through only on a 404 (model unavailable).
  let json: unknown = null;
  let lastDetail = "";
  for (const model of GEMINI_MODELS) {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: requestBody,
      }
    );

    if (res.ok) {
      json = await res.json();
      break;
    }

    let detail = "";
    try {
      const j = await res.json();
      detail = j?.error?.message ?? JSON.stringify(j);
    } catch {
      detail = await res.text().catch(() => "");
    }
    lastDetail = `${res.status}${detail ? ` — ${detail}` : ""}`;

    const modelUnavailable =
      res.status === 404 || /not found|not supported|ListModels/i.test(detail);
    if (!modelUnavailable) {
      // Quota, auth, bad request, etc. — surface immediately.
      throw new Error(`Gemini request failed: ${lastDetail}`);
    }
    // else: try the next model in the chain
  }

  if (json === null) {
    throw new Error(`Gemini request failed: no available model (${lastDetail})`);
  }
  const typed = json as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const rawText: string =
    typed?.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";

  try {
    const parsed = JSON.parse(rawText);
    const valid = ["HOTEL", "ATTRACTION", "ACTIVITY", "FOOD", "OTHER"];
    const places: ExtractedPlace[] = Array.isArray(parsed.places)
      ? parsed.places
          .filter((p: { name?: unknown }) => p && typeof p.name === "string" && p.name.trim())
          .map((p: { name: string; category?: string; note?: string }) => ({
            name: p.name.trim(),
            category: valid.includes(String(p.category).toUpperCase())
              ? (String(p.category).toUpperCase() as ExtractedPlace["category"])
              : "OTHER",
            note: p.note?.trim() || undefined,
          }))
      : [];
    return { reply: parsed.reply ?? "מצאתי את המקומות.", places };
  } catch {
    return { reply: rawText || "לא הצלחתי לעבד את התשובה.", places: [] };
  }
}
