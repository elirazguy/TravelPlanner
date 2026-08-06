// ─────────────────────────────────────────────────────────────────────────────
// Trip context — a compact, structured snapshot of the trip's database state
// that we feed to the AI so it can reason about the specific trip.
// ─────────────────────────────────────────────────────────────────────────────
export interface TripContext {
  title: string;
  destination: string;
  country: string;
  startDate: string;
  endDate: string;
  notes?: string | null;
  days: {
    dayNumber: number;
    date: string;
    events: {
      title: string;
      category: string;
      startTime?: string | null;
      locationName?: string | null;
      description?: string | null;
    }[];
  }[];
  hotels: { name: string; address?: string | null; checkInDate?: string | null; checkOutDate?: string | null }[];
  savedPlaces?: {
    name: string;
    category?: string | null;
    address?: string | null;
    inPlan: boolean;
  }[];
}

export function buildTripContextBlock(ctx: TripContext): string {
  const lines: string[] = [];
  lines.push(`TRIP: ${ctx.title}`);
  lines.push(`DESTINATION: ${ctx.destination} (${ctx.country})`);
  lines.push(`DATES: ${ctx.startDate} to ${ctx.endDate}`);
  if (ctx.notes) lines.push(`TRAVELER NOTES: ${ctx.notes}`);
  lines.push("");
  lines.push("ITINERARY:");
  if (ctx.days.length === 0) {
    lines.push("  (no days planned yet)");
  }
  for (const day of ctx.days) {
    lines.push(`  Day ${day.dayNumber} — ${day.date}`);
    if (day.events.length === 0) {
      lines.push("    (no events scheduled)");
    }
    for (const e of day.events) {
      const time = e.startTime ? `${e.startTime} ` : "";
      const loc = e.locationName ? ` @ ${e.locationName}` : "";
      lines.push(`    - ${time}[${e.category}] ${e.title}${loc}`);
      if (e.description) lines.push(`        ${e.description}`);
    }
  }
  if (ctx.hotels.length > 0) {
    lines.push("");
    lines.push("ACCOMMODATIONS:");
    for (const h of ctx.hotels) {
      lines.push(
        `  - ${h.name}${h.address ? `, ${h.address}` : ""}${
          h.checkInDate ? ` (${h.checkInDate} → ${h.checkOutDate ?? "?"})` : ""
        }`
      );
    }
  }
  if (ctx.savedPlaces && ctx.savedPlaces.length > 0) {
    lines.push("");
    lines.push(
      "SAVED PLACES (the traveler's own shortlist of spots they want to consider for this trip):"
    );
    for (const p of ctx.savedPlaces) {
      const tag = p.inPlan ? "ALREADY IN ITINERARY" : "NOT YET SCHEDULED";
      lines.push(
        `  - [${tag}] ${p.name}${p.category ? ` (${p.category})` : ""}${
          p.address ? ` — ${p.address}` : ""
        }`
      );
    }
  }
  return lines.join("\n");
}

const GEMINI_MODELS = [
  "gemini-2.5-flash",
  "gemini-flash-latest",
];

async function callGemini(
  systemInstruction: string,
  messages: { role: string; content: string }[],
  schema?: any
): Promise<string> {
  const key = process.env.GOOGLE_GEMINI_API_KEY;
  if (!key) {
    throw new Error(
      "GOOGLE_GEMINI_API_KEY is not set. Add it to your .env to enable the AI Travel Consultant."
    );
  }

  // Map "assistant" to "model" for Gemini.
  const contents = messages.map((m) => ({
    role: m.role === "assistant" ? "model" : m.role,
    parts: [{ text: m.content }],
  }));

  const requestBody: any = {
    contents,
    system_instruction: {
      parts: [{ text: systemInstruction }],
    },
    generationConfig: {
      temperature: 0.5,
    },
  };

  if (schema) {
    requestBody.generationConfig.responseMimeType = "application/json";
    requestBody.generationConfig.responseSchema = schema;
  }

  let json: any = null;
  let lastDetail = "";
  for (const model of GEMINI_MODELS) {
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

    let detail = "";
    try {
      const j = await res.json();
      detail = j?.error?.message ?? JSON.stringify(j);
    } catch {
      detail = await res.text().catch(() => "");
    }
    lastDetail = `${res.status}${detail ? ` — ${detail}` : ""}`;

    const modelUnavailable = res.status === 404 || /not found|not supported|ListModels/i.test(detail);
    if (!modelUnavailable) {
      throw new Error(`Gemini request failed: ${lastDetail}`);
    }
  }

  if (json === null) {
    throw new Error(`Gemini request failed: no available model (${lastDetail})`);
  }

  const rawText = json?.candidates?.[0]?.content?.parts?.map((p: any) => p.text ?? "").join("") ?? "";
  return rawText.trim();
}

// ─────────────────────────────────────────────────────────────────────────────
// AI Skill 1 — Itinerary & Preference Analyzer
// ─────────────────────────────────────────────────────────────────────────────
const ANALYZER_SYSTEM = `You are an expert travel consultant embedded inside a trip-planning app.
You are given the live database state of one specific trip: its destination, dates, the day-by-day itinerary, scheduled activities, and accommodations.

Your job:
1. Analyze the planned activities to infer the traveler's IMPLICIT preferences (e.g. food-focused, museum lover, outdoorsy, fast-paced vs. relaxed, budget vs. luxury, nightlife, family-oriented).
2. Identify gaps, pacing problems, geographic inefficiencies (activities that backtrack across the city), or days that are over/under-scheduled. You must explicitly analyze the load and pace of EACH DAY: compare the number of scheduled points against the time available, assess the estimated distances and travel times between points, and flag if a day is too packed, too empty, or poorly routed.
3. Provide tailored, SPECIFIC recommendations — name real neighborhoods, dishes, venues, and experiences that fit the destination and the inferred preferences. Tie each recommendation to evidence from their itinerary.

CRITICAL — use the traveler's SAVED PLACES first: The context may include a SAVED PLACES list (their own shortlist). When the traveler asks for a recommendation, or when you suggest what to add, FIRST check the saved places marked "NOT YET SCHEDULED" — if any of them fit the request or the inferred preferences, recommend THOSE first and clearly note they come from the traveler's saved list (e.g. "מהרשימה השמורה שלך"). Only if none of the unscheduled saved places fit should you suggest brand-new places of your own. Do not recommend saved places already marked "ALREADY IN ITINERARY".

Be concrete and personalized, never generic. Respond in clean Markdown with short sections and bullet points. Open with a one-paragraph read of who this traveler is based on their plan.

IMPORTANT: You MUST respond entirely in Hebrew (עברית). All text, headings, bullet points, and recommendations must be written in Hebrew.`;

export async function runItineraryAnalyzer(
  ctx: TripContext,
  userQuestion?: string
): Promise<string> {
  const contextBlock = buildTripContextBlock(ctx);
  const ask =
    userQuestion?.trim() ||
    "Analyze my itinerary, infer my travel preferences, and give me tailored recommendations.";
  
  return callGemini(ANALYZER_SYSTEM, [
    {
      role: "user",
      content: `Here is the current state of my trip:\n\n<trip_state>\n${contextBlock}\n</trip_state>\n\n${ask}`,
    },
  ]);
}

// ─────────────────────────────────────────────────────────────────────────────
// AI Skill — Smart Recommendation (chat)
// ─────────────────────────────────────────────────────────────────────────────
const RECOMMEND_SYSTEM = `You are a friendly, sharp travel recommendation assistant embedded in a trip-planning app. You are given the traveler's full trip: the day-by-day itinerary (with times, activities and locations), accommodations, and their saved-places shortlist.

The traveler chats with you to get small, specific recommendations — e.g. "recommend a restaurant for dinner on day 2", "something to do near my afternoon plans on day 3".

For each request:
- Work out from the itinerary what they are doing on the relevant day and roughly which area / neighborhood they will be in (from the locations of that day's events and their hotel), and tailor the recommendation to that area and the timing.
- If any of the traveler's SAVED PLACES marked "NOT YET SCHEDULED" fit the request, recommend those first and say they come from the saved list. Otherwise suggest specific, real venues by name, each with a one-line reason.
- Keep it short and conversational — a couple of concrete options, not an essay. Ask a brief clarifying question only when essential.

Respond entirely in Hebrew (עברית).`;

export async function runRecommendationChat(
  ctx: TripContext,
  messages: { role: "user" | "assistant"; content: string }[]
): Promise<string> {
  const contextBlock = buildTripContextBlock(ctx);
  const system = `${RECOMMEND_SYSTEM}\n\nHere is the current state of the trip:\n<trip_state>\n${contextBlock}\n</trip_state>`;
  
  return callGemini(system, messages);
}

// ─────────────────────────────────────────────────────────────────────────────
// AI Skill 2 — Smart Packing Assistant
// ─────────────────────────────────────────────────────────────────────────────
const PACKING_SYSTEM = `You are a meticulous packing assistant inside a trip-planning app.
You are given a specific trip: destination, exact dates, the planned activities, and accommodations.

Your job:
1. Determine the SEASON and typical historical weather for that destination during those exact dates (temperature range, rain/humidity likelihood, daylight). State the expected conditions explicitly up front.
2. Use the planned ACTIVITIES to tailor the list — e.g. hiking gear for trails, modest attire for temples/religious sites, formal wear for fine dining, swimwear for beaches, adapters for the country's plug type.
3. Produce a personalized, categorized packing checklist.

Organize the response in Markdown with these sections:
- "מזג אוויר צפוי" (2-4 sentences on the seasonal weather for those dates)
- "ביגוד" / "הנעלה" / "אלקטרוניקה ומתאמים" / "מסמכים וכסף" / "טיפוח ובריאות" / "ציוד מיוחד לפעילויות" / "טיפים ייחודיים ליעד"
Use checkbox bullets ("- [ ] item"). Keep quantities sensible for the trip length. Call out anything climate- or culture-specific to this destination and season.

IMPORTANT: You MUST respond entirely in Hebrew (עברית). All text, headings, section names, bullet points, and tips must be written in Hebrew.`;

export async function runPackingAssistant(
  ctx: TripContext,
  userNote?: string,
  permanentItems?: string[]
): Promise<string> {
  const contextBlock = buildTripContextBlock(ctx);
  const extra = userNote?.trim()
    ? `\n\nAdditional traveler note: ${userNote.trim()}`
    : "";
  const permanentSection =
    permanentItems && permanentItems.length > 0
      ? `\n\nThe traveler has these PERMANENT items they pack on every trip:\n${permanentItems.map((i) => `- ${i}`).join("\n")}\n\nYou MUST include these in a dedicated section called "## ציוד קבוע" at the VERY START of your response, formatted as checkbox bullets ("- [ ] item"). Then continue with your trip-specific recommendations WITHOUT repeating these items anywhere else.`
      : "";

  return callGemini(PACKING_SYSTEM, [
    {
      role: "user",
      content: `Generate a personalized packing list for this trip:\n\n<trip_state>\n${contextBlock}\n</trip_state>${permanentSection}${extra}`,
    },
  ]);
}

// ─────────────────────────────────────────────────────────────────────────────
// AI helper — classify imported saved places
// ─────────────────────────────────────────────────────────────────────────────
const CLASSIFY_SYSTEM = `You categorize travel places into exactly one of these buckets:
- HOTEL — hotels, hostels, B&Bs, apartments, any lodging
- FOOD — restaurants, cafés, bars, bakeries, food markets, anywhere you primarily eat or drink
- ATTRACTION — landmarks, museums, parks, viewpoints, monuments, sights you visit
- ACTIVITY — tours, shows, experiences, shops, sports, nightlife, things you do
- OTHER — anything that fits none of the above

You receive a numbered list of place names (possibly in Hebrew or English, possibly with an address). Respond with the proper category for each place.`;

export type SavedPlaceBucket = "HOTEL" | "FOOD" | "ATTRACTION" | "ACTIVITY" | "OTHER";

export async function classifySavedPlaces(
  places: { name: string; address?: string | null }[]
): Promise<SavedPlaceBucket[]> {
  if (places.length === 0) return [];
  const list = places
    .map((p, i) => `${i + 1}. ${p.name}${p.address ? ` (${p.address})` : ""}`)
    .join("\n");

  const schema = {
    type: "ARRAY",
    items: {
      type: "STRING",
      enum: ["HOTEL", "FOOD", "ATTRACTION", "ACTIVITY", "OTHER"]
    },
  };

  const response = await callGemini(CLASSIFY_SYSTEM, [{ role: "user", content: `Classify these places in order:\n${list}` }], schema);
  
  try {
    const parsed = JSON.parse(response);
    if (Array.isArray(parsed) && parsed.length === places.length) {
      return parsed as SavedPlaceBucket[];
    }
  } catch {
    // fallback below
  }
  return places.map(() => "OTHER");
}
