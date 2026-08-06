import { NextRequest, NextResponse } from "next/server";
import { searchPlaces } from "@/lib/places";

// GET /api/places/search?q=...&lat=..&lng=.. — Google Places text search.
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q");
  if (!q) return NextResponse.json([], { status: 200 });
  const latStr = req.nextUrl.searchParams.get("lat");
  const lngStr = req.nextUrl.searchParams.get("lng");
  const bias =
    latStr && lngStr
      ? { lat: parseFloat(latStr), lng: parseFloat(lngStr) }
      : undefined;
  try {
    const results = await searchPlaces(q, bias);
    return NextResponse.json(results);
  } catch (err) {
    const msg = (err as Error).message;
    console.error("[Places search]", msg);
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
