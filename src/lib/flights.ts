// Live flight tracking via AeroDataBox (RapidAPI) (https://rapidapi.com/aero-data-box-aero-data-box-default/api/aerodatabox).
//
// AeroDataBox `/flights/number/{flightNumber}/{date}` returns live
// status, scheduled/estimated/actual times, terminals, gates and delays.
// If no API key is configured we return a clearly-marked mock so the UI is
// demonstrable without external credentials.

export interface LiveFlightStatus {
  flightNumber: string;
  airline?: string;
  status?: string; // scheduled | active | landed | cancelled | incident | diverted | unknown
  departure: {
    airport?: string;
    iata?: string;
    terminal?: string | null;
    gate?: string | null;
    scheduled?: string | null;
    estimated?: string | null;
    actual?: string | null;
    delayMinutes?: number | null;
  };
  arrival: {
    airport?: string;
    iata?: string;
    terminal?: string | null;
    gate?: string | null;
    scheduled?: string | null;
    estimated?: string | null;
    actual?: string | null;
    delayMinutes?: number | null;
  };
  live?: {
    updated?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    altitude?: number | null;
    isGround?: boolean | null;
  } | null;
  source: "aerodatabox" | "mock";
  fetchedAt: string;
}

export async function fetchLiveFlight(
  flightNumber: string,
  flightDate?: string
): Promise<LiveFlightStatus> {
  const key = process.env.RAPIDAPI_KEY || process.env.FLIGHT_API_KEY;
  const normalized = flightNumber.replace(/\s+/g, "").toUpperCase();

  if (!key) {
    return mockFlight(normalized);
  }

  const dateStr = flightDate ? flightDate.slice(0, 10) : new Date().toISOString().slice(0, 10);
  const url = `https://aerodatabox.p.rapidapi.com/flights/number/${encodeURIComponent(normalized)}/${dateStr}`;

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "x-rapidapi-key": key,
        "x-rapidapi-host": "aerodatabox.p.rapidapi.com",
      },
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      if (res.status === 404) {
        return {
          flightNumber: normalized,
          status: "not_found",
          departure: {},
          arrival: {},
          source: "aerodatabox",
          fetchedAt: new Date().toISOString(),
        };
      }
      throw new Error(`AeroDataBox request failed: ${res.status}`);
    }

    const json = await res.json();
    const record = Array.isArray(json) ? json[0] : json;

    if (!record) {
      return {
        flightNumber: normalized,
        status: "unknown",
        departure: {},
        arrival: {},
        source: "aerodatabox",
        fetchedAt: new Date().toISOString(),
      };
    }

    const statusMap: Record<string, string> = {
      Expected: "scheduled",
      EnRoute: "active",
      Landed: "landed",
      Canceled: "cancelled",
      Diverted: "diverted",
    };

    return {
      flightNumber: normalized,
      airline: record.airline?.name,
      status: statusMap[record.status] || record.status?.toLowerCase() || "unknown",
      departure: {
        airport: record.departure?.airport?.name,
        iata: record.departure?.airport?.iata,
        terminal: record.departure?.terminal ?? null,
        gate: record.departure?.gate ?? null,
        scheduled: record.departure?.scheduledTime?.utc || record.departure?.scheduledTime?.local || null,
        estimated: record.departure?.revisedTime?.utc || record.departure?.revisedTime?.local || null,
        actual: record.departure?.actualTime?.utc || record.departure?.actualTime?.local || null,
        delayMinutes: null,
      },
      arrival: {
        airport: record.arrival?.airport?.name,
        iata: record.arrival?.airport?.iata,
        terminal: record.arrival?.terminal ?? null,
        gate: record.arrival?.gate ?? null,
        scheduled: record.arrival?.scheduledTime?.utc || record.arrival?.scheduledTime?.local || null,
        estimated: record.arrival?.revisedTime?.utc || record.arrival?.revisedTime?.local || null,
        actual: record.arrival?.actualTime?.utc || record.arrival?.actualTime?.local || null,
        delayMinutes: null,
      },
      live: null,
      source: "aerodatabox",
      fetchedAt: new Date().toISOString(),
    };
  } catch (err) {
    console.error("Flight fetch error:", err);
    return mockFlight(normalized);
  }
}

function mockFlight(flightNumber: string): LiveFlightStatus {
  const now = new Date();
  const dep = new Date(now.getTime() + 2 * 3600_000);
  const arr = new Date(now.getTime() + 5 * 3600_000);
  return {
    flightNumber,
    airline: "Sample Airways",
    status: "scheduled",
    departure: {
      airport: "London Heathrow",
      iata: "LHR",
      terminal: "5",
      gate: "A12",
      scheduled: dep.toISOString(),
      estimated: dep.toISOString(),
      actual: null,
      delayMinutes: 0,
    },
    arrival: {
      airport: "John F. Kennedy",
      iata: "JFK",
      terminal: "7",
      gate: "B22",
      scheduled: arr.toISOString(),
      estimated: arr.toISOString(),
      actual: null,
      delayMinutes: 0,
    },
    live: null,
    source: "mock",
    fetchedAt: new Date().toISOString(),
  };
}
