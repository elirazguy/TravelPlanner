// Shared taxonomies and palettes used across the app.

// Pre-defined document tags for the Documents Vault filtering UI.
export const DOCUMENT_TAGS = [
  "FLIGHT",
  "HOTEL",
  "VISA",
  "PASSPORT",
  "INSURANCE",
  "RENTAL",
  "TICKET",
  "ITINERARY",
  "OTHER",
] as const;

export type DocumentTag = (typeof DOCUMENT_TAGS)[number];

export const DOCUMENT_TAG_META: Record<
  DocumentTag,
  { label: string; color: string }
> = {
  FLIGHT: { label: "טיסה", color: "bg-sky-100 text-sky-700 ring-sky-600/20" },
  HOTEL: { label: "מלון", color: "bg-violet-100 text-violet-700 ring-violet-600/20" },
  VISA: { label: "ויזה", color: "bg-amber-100 text-amber-700 ring-amber-600/20" },
  PASSPORT: { label: "דרכון", color: "bg-rose-100 text-rose-700 ring-rose-600/20" },
  INSURANCE: { label: "ביטוח", color: "bg-emerald-100 text-emerald-700 ring-emerald-600/20" },
  RENTAL: { label: "השכרת רכב", color: "bg-teal-100 text-teal-700 ring-teal-600/20" },
  TICKET: { label: "כרטיסים", color: "bg-fuchsia-100 text-fuchsia-700 ring-fuchsia-600/20" },
  ITINERARY: { label: "מסלול", color: "bg-blue-100 text-blue-700 ring-blue-600/20" },
  OTHER: { label: "אחר", color: "bg-ink-100 text-ink-700 ring-ink-600/20" },
};

// Event categories for the Daily Itinerary planner.
export const EVENT_CATEGORIES = [
  "SIGHTSEEING",
  "FOOD",
  "ACTIVITY",
  "TRANSPORT",
  "LODGING",
  "OTHER",
] as const;

export type EventCategory = (typeof EVENT_CATEGORIES)[number];

export const EVENT_CATEGORY_META: Record<
  EventCategory,
  { label: string; emoji: string }
> = {
  SIGHTSEEING: { label: "אטרקציות", emoji: "🏛️" },
  FOOD: { label: "אוכל ושתייה", emoji: "🍜" },
  ACTIVITY: { label: "פעילות", emoji: "🎟️" },
  TRANSPORT: { label: "תחבורה", emoji: "🚆" },
  LODGING: { label: "לינה", emoji: "🏨" },
  OTHER: { label: "אחר", emoji: "📌" },
};

// Saved-place categories — the four buckets the AI classifies imported places
// into (plus OTHER). Each maps to an EventCategory so a saved place dragged
// into the itinerary becomes an event with a sensible category.
export const SAVED_PLACE_CATEGORIES = [
  "HOTEL",
  "ATTRACTION",
  "ACTIVITY",
  "FOOD",
  "OTHER",
] as const;

export type SavedPlaceCategory = (typeof SAVED_PLACE_CATEGORIES)[number];

export const SAVED_PLACE_CATEGORY_META: Record<
  SavedPlaceCategory,
  { label: string; emoji: string; eventCategory: EventCategory }
> = {
  HOTEL: { label: "מלונות", emoji: "🏨", eventCategory: "LODGING" },
  ATTRACTION: { label: "אטרקציות", emoji: "🏛️", eventCategory: "SIGHTSEEING" },
  ACTIVITY: { label: "פעילויות", emoji: "🎟️", eventCategory: "ACTIVITY" },
  FOOD: { label: "אוכל", emoji: "🍜", eventCategory: "FOOD" },
  OTHER: { label: "אחר", emoji: "📌", eventCategory: "OTHER" },
};

// Distinct, high-contrast palette for color-coding days on the map.
// Day 1 -> red, Day 2 -> blue, Day 3 -> green, etc. (cycles after the list).
export const DAY_COLORS = [
  "#ef4444", // red
  "#3b82f6", // blue
  "#22c55e", // green
  "#f59e0b", // amber
  "#a855f7", // purple
  "#ec4899", // pink
  "#14b8a6", // teal
  "#f97316", // orange
  "#6366f1", // indigo
  "#84cc16", // lime
  "#06b6d4", // cyan
  "#dc2626", // dark red
];

export function colorForDay(dayNumber: number): string {
  return DAY_COLORS[(dayNumber - 1) % DAY_COLORS.length];
}

export const TRIP_STATUSES = ["PLANNING", "UPCOMING", "ARCHIVED"] as const;
export type TripStatus = (typeof TRIP_STATUSES)[number];
