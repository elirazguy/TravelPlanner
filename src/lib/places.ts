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

function normName(s: string): string {
  return s
    .toLowerCase()
    .replace(/["'`׳״.,\-־()]/g, "")
    .replace(/\s+/g, "")
    .trim();
}

export async function syncTripSavedPlacesAndEvents(tripId: string) {
  const { prisma } = await import("@/lib/prisma");

  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    include: {
      days: { include: { events: true } },
      savedPlaces: true,
    },
  });

  if (!trip) return;

  const bias =
    trip.mapCenterLat && trip.mapCenterLng
      ? { lat: trip.mapCenterLat, lng: trip.mapCenterLng }
      : undefined;

  const savedPlaces = trip.savedPlaces;
  const updates: Promise<any>[] = [];

  function isMatch(eventText: string, savedName: string): boolean {
    const n1 = normName(eventText);
    const n2 = normName(savedName);
    if (!n1 || !n2) return false;
    return n1 === n2 || n1.includes(n2) || n2.includes(n1);
  }

  for (const day of trip.days) {
    for (const event of day.events) {
      // Find matching savedPlace
      const matchedSaved = savedPlaces.find((p) => {
        if (event.placeId && p.placeId && event.placeId === p.placeId) return true;
        if (event.locationName && isMatch(event.locationName, p.name)) return true;
        if (event.title && isMatch(event.title, p.name)) return true;
        return false;
      });

      if (matchedSaved) {
        // 1. Assign savedPlace to day if not already assigned
        if (matchedSaved.assignedDayId !== day.id) {
          matchedSaved.assignedDayId = day.id;
          updates.push(
            prisma.savedPlace.update({
              where: { id: matchedSaved.id },
              data: { assignedDayId: day.id },
            }).catch(() => {})
          );
        }

        // 2. Fill missing event coordinates from savedPlace
        if (
          event.lat == null ||
          event.lng == null ||
          !event.placeId ||
          !event.locationName
        ) {
          const newLat = event.lat ?? matchedSaved.lat;
          const newLng = event.lng ?? matchedSaved.lng;
          const newPlaceId = event.placeId || matchedSaved.placeId || null;
          const newAddress = event.address || matchedSaved.address || null;
          const newLocName = event.locationName || matchedSaved.name;

          if (newLat != null && newLng != null) {
            event.lat = newLat;
            event.lng = newLng;
            event.placeId = newPlaceId;
            event.address = newAddress;
            event.locationName = newLocName;

            updates.push(
              prisma.event.update({
                where: { id: event.id },
                data: {
                  lat: newLat,
                  lng: newLng,
                  placeId: newPlaceId,
                  address: newAddress,
                  locationName: newLocName,
                },
              }).catch(() => {})
            );
          }
        }
      } else if (event.lat == null || event.lng == null) {
        // 3. Search Google Places for unmatched event missing coordinates
        const query = (event.locationName || event.title || "").trim();
        if (query) {
          updates.push(
            (async () => {
              try {
                const results = await searchPlaces(query, bias);
                if (results && results.length > 0) {
                  const res = results[0];
                  if (res.lat != null && res.lng != null) {
                    event.lat = res.lat;
                    event.lng = res.lng;
                    event.placeId = event.placeId || res.placeId || null;
                    event.address = event.address || res.address || null;

                    await prisma.event.update({
                      where: { id: event.id },
                      data: {
                        lat: res.lat,
                        lng: res.lng,
                        ...(res.placeId && !event.placeId ? { placeId: res.placeId } : {}),
                        ...(res.address && !event.address ? { address: res.address } : {}),
                      },
                    }).catch(() => {});
                  }
                }
              } catch (e) {
                console.error(`Failed to geocode event ${event.id}:`, e);
              }
            })()
          );
        }
      }
    }
  }

  if (updates.length > 0) {
    await Promise.all(updates);
  }
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
