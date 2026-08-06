// Builds external navigation deep links (Google Maps directions + Waze) for a
// location target. Prefers exact coordinates, falls back to a name/address query.

export interface NavTarget {
  lat?: number | null;
  lng?: number | null;
  name?: string | null;
  address?: string | null;
  placeId?: string | null;
}

export function hasNavTarget(t: NavTarget): boolean {
  return (t.lat != null && t.lng != null) || !!(t.name || t.address);
}

export function googleMapsNavUrl(t: NavTarget): string {
  const params = new URLSearchParams({ api: "1" });
  if (t.lat != null && t.lng != null) {
    params.set("destination", `${t.lat},${t.lng}`);
  } else {
    params.set("destination", t.name || t.address || "");
  }
  if (t.placeId) params.set("destination_place_id", t.placeId);
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

export function wazeNavUrl(t: NavTarget): string {
  if (t.lat != null && t.lng != null) {
    return `https://waze.com/ul?ll=${t.lat},${t.lng}&navigate=yes`;
  }
  const q = encodeURIComponent(t.name || t.address || "");
  return `https://waze.com/ul?q=${q}&navigate=yes`;
}
