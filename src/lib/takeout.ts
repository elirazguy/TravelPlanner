// Parsers for Google Takeout "Saved" lists. Google exports each saved list as
// either a CSV (Title,Note,URL) or a GeoJSON FeatureCollection. These run in
// the browser so the file never leaves the user's machine until they confirm
// the import. We extract a clean { name, address?, lat?, lng?, note?, url? }.

export interface ParsedPlace {
  name: string;
  address?: string;
  lat?: number;
  lng?: number;
  note?: string;
  url?: string;
}

// Pull lat/lng out of a Google Maps URL using the common encodings.
export function coordsFromMapsUrl(
  url: string
): { lat: number; lng: number } | null {
  if (!url) return null;
  // !3d<lat>!4d<lng> (data param — most precise place pin)
  const data = url.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
  if (data) return { lat: parseFloat(data[1]), lng: parseFloat(data[2]) };
  // @<lat>,<lng> (viewport center)
  const at = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (at) return { lat: parseFloat(at[1]), lng: parseFloat(at[2]) };
  // ?q=<lat>,<lng> or query=<lat>,<lng>
  const q = url.match(/(?:[?&](?:q|query)=)(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (q) return { lat: parseFloat(q[1]), lng: parseFloat(q[2]) };
  return null;
}

// Minimal RFC-4180-ish CSV row splitter (handles quoted fields with commas
// and escaped double quotes).
function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      out.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out;
}

function parseCsv(text: string): ParsedPlace[] {
  // Split into logical rows, respecting quoted newlines.
  const rows: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') inQuotes = !inQuotes;
    if ((ch === "\n" || ch === "\r") && !inQuotes) {
      if (cur.trim()) rows.push(cur);
      cur = "";
      if (ch === "\r" && text[i + 1] === "\n") i++;
    } else {
      cur += ch;
    }
  }
  if (cur.trim()) rows.push(cur);
  if (rows.length === 0) return [];

  const header = splitCsvLine(rows[0]).map((h) => h.trim().toLowerCase());
  const titleIdx = header.findIndex((h) => h === "title" || h === "name");
  const noteIdx = header.findIndex((h) => h === "note" || h === "comment");
  const urlIdx = header.findIndex((h) => h === "url");

  const places: ParsedPlace[] = [];
  for (let r = 1; r < rows.length; r++) {
    const cols = splitCsvLine(rows[r]);
    const name = (titleIdx >= 0 ? cols[titleIdx] : cols[0])?.trim();
    if (!name) continue;
    const url = urlIdx >= 0 ? cols[urlIdx]?.trim() : undefined;
    const note = noteIdx >= 0 ? cols[noteIdx]?.trim() : undefined;
    const coords = url ? coordsFromMapsUrl(url) : null;
    places.push({
      name,
      note: note || undefined,
      url: url || undefined,
      lat: coords?.lat,
      lng: coords?.lng,
    });
  }
  return places;
}

function parseGeoJson(text: string): ParsedPlace[] {
  const json = JSON.parse(text);
  const features = Array.isArray(json?.features) ? json.features : [];
  const places: ParsedPlace[] = [];
  for (const f of features) {
    const props = f?.properties ?? {};
    const loc = props.location ?? {};
    const name =
      loc.name ?? props.Title ?? props.title ?? props.name ?? null;
    if (!name) continue;
    const coords = f?.geometry?.coordinates; // [lng, lat]
    const url = props.google_maps_url ?? props.url ?? undefined;
    places.push({
      name: String(name).trim(),
      address: loc.address ? String(loc.address) : undefined,
      lat: Array.isArray(coords) ? coords[1] : undefined,
      lng: Array.isArray(coords) ? coords[0] : undefined,
      note: props.Comment ? String(props.Comment) : undefined,
      url,
    });
  }
  return places;
}

// Parse a Takeout file by sniffing its content (GeoJSON vs CSV).
export function parseTakeoutFile(fileName: string, text: string): ParsedPlace[] {
  const trimmed = text.trimStart();
  if (fileName.toLowerCase().endsWith(".json") || trimmed.startsWith("{")) {
    return parseGeoJson(text);
  }
  return parseCsv(text);
}

// Derive a default list name from the file name (Takeout names CSVs after the
// list, e.g. "ניו יורק.csv").
export function listNameFromFile(fileName: string): string {
  return fileName.replace(/\.(csv|json|geojson)$/i, "").trim() || "רשימה";
}
