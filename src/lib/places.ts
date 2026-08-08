// Server-side Google Places helpers (Places API v1 / legacy text search +
// details). Used to search locations for itinerary events and to import the
// user's "Saved Places".
//
// Google does not expose an end-user's private "Saved Places" lists through a
// public API. The supported pattern — and what we implement here — is:
//   1. Let the user search/discover places via the Places API.
//   2. Persist chosen places as the trip's SavedPlace collection.
//   3. Assign each saved place to a day in the planner.
// (If running with a Google Takeout export of saved places, those rows can be
//  bulk-imported through the same /api/trips/[id]/places endpoint.)

export interface PlaceResult {
  placeId: string;
  name: string;
  address?: string;
  lat?: number;
  lng?: number;
  category?: string;
  rating?: number;
}

const SERVER_KEY = () => process.env.GOOGLE_MAPS_SERVER_API_KEY;

export async function searchPlaces(
  query: string,
  bias?: { lat: number; lng: number }
): Promise<PlaceResult[]> {
  const key = SERVER_KEY();
  if (!key) {
    // No key — return a small deterministic mock so the flow is demonstrable.
    return mockSearch(query);
  }

  const body: Record<string, unknown> = {
    textQuery: query,
    maxResultCount: 10,
    // Localize result display names to Hebrew. The text query itself can be in
    // any language (Hebrew or English) — Google matches it regardless.
    languageCode: "he",
  };
  if (bias) {
    body.locationBias = {
      circle: {
        center: { latitude: bias.lat, longitude: bias.lng },
        radius: 30000,
      },
    };
  }

  const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": key,
      "X-Goog-FieldMask":
        "places.id,places.displayName,places.formattedAddress,places.location,places.types,places.rating",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    // Surface Google's actual error reason (403 usually means the API key is
    // missing "Places API (New)" access, has referer/IP restrictions, or the
    // project has no billing enabled).
    let detail = "";
    try {
      const errJson = await res.json();
      detail = errJson?.error?.message ?? JSON.stringify(errJson);
    } catch {
      detail = await res.text().catch(() => "");
    }
    throw new Error(
      `Google Places searchText failed: ${res.status} ${res.statusText}${
        detail ? ` — ${detail}` : ""
      }`
    );
  }
  const json = await res.json();
  const places = json?.places ?? [];
  return places.map(
    (p: any): PlaceResult => ({
      placeId: p.id,
      name: p.displayName?.text ?? "Unknown place",
      address: p.formattedAddress,
      lat: p.location?.latitude,
      lng: p.location?.longitude,
      category: Array.isArray(p.types) ? p.types[0] : undefined,
      rating: p.rating,
    })
  );
}

// Find a real, representative photo for a query (e.g. a destination or
// landmark) via Google Places Photos. Returns a temporary Google photo URI to
// download, or null if no key/photo is available.
export async function getPlacePhoto(query: string): Promise<string | null> {
  const key = SERVER_KEY();
  if (!key) return null;
  try {
    const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": key,
        "X-Goog-FieldMask": "places.photos,places.displayName",
      },
      body: JSON.stringify({ textQuery: query, maxResultCount: 5 }),
    });
    if (!res.ok) return null;
    const json = await res.json();
    for (const p of json?.places ?? []) {
      const photoName = p?.photos?.[0]?.name;
      if (!photoName) continue;
      const mediaRes = await fetch(
        `https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=1280&skipHttpRedirect=true&key=${key}`
      );
      if (mediaRes.ok) {
        const mj = await mediaRes.json();
        if (mj?.photoUri) return mj.photoUri as string;
      }
    }
  } catch {
    // fall through to null
  }
  return null;
}

function mockSearch(query: string): PlaceResult[] {
  return [
    {
      placeId: `mock-${query}-1`,
      name: `${query} (sample result)`,
      address: "123 Demo Street",
      lat: 35.6764 + Math.random() * 0.02,
      lng: 139.65 + Math.random() * 0.02,
      category: "point_of_interest",
      rating: 4.5,
    },
    {
      placeId: `mock-${query}-2`,
      name: `${query} Museum`,
      address: "456 Sample Ave",
      lat: 35.69 + Math.random() * 0.02,
      lng: 139.7 + Math.random() * 0.02,
      category: "museum",
      rating: 4.2,
    },
  ];
}

export async function ensureEventsGeocoded(
  events: Array<{
    id: string;
    title: string;
    locationName?: string | null;
    address?: string | null;
    lat?: number | null;
    lng?: number | null;
    placeId?: string | null;
  }>,
  bias?: { lat: number; lng: number }
) {
  const missingEvents = events.filter((e) => e.lat == null || e.lng == null);
  if (missingEvents.length === 0) return;

  const { prisma } = await import("@/lib/prisma");

  await Promise.all(
    missingEvents.map(async (e) => {
      const query = (e.locationName || e.title || "").trim();
      if (!query) return;

      try {
        const results = await searchPlaces(query, bias);
        if (results && results.length > 0) {
          const match = results[0];
          if (match.lat != null && match.lng != null) {
            e.lat = match.lat;
            e.lng = match.lng;
            if (!e.placeId) e.placeId = match.placeId || null;
            if (!e.address) e.address = match.address || null;

            await prisma.event.update({
              where: { id: e.id },
              data: {
                lat: match.lat,
                lng: match.lng,
                ...(match.placeId ? { placeId: match.placeId } : {}),
                ...(match.address && !e.address ? { address: match.address } : {}),
              },
            }).catch(() => {});
          }
        }
      } catch (err) {
        console.error(`Failed to auto-geocode event ${e.id} (${query}):`, err);
      }
    })
  );
}
