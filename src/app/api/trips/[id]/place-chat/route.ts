import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { runPlaceChat, type ChatTurn, type ExtractedPlace } from "@/lib/gemini";
import { extractUrls, fetchCaptions } from "@/lib/social";
import { searchPlaces } from "@/lib/places";

type Params = { params: Promise<{ id: string }> };

interface EnrichedPlace extends ExtractedPlace {
  address?: string;
  lat?: number;
  lng?: number;
  placeId?: string;
}

// POST /api/trips/[id]/place-chat — conversational place-list builder powered by
// Gemini. Accepts text, an optional image (base64), and detects shared social
// links (Instagram/TikTok) to pull captions from. Returns a reply plus the
// extracted places, enriched with Google Places coordinates when resolvable.
export async function POST(req: NextRequest, { params }: Params) {
  const { id: tripId } = await params;
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    select: { destination: true, country: true, mapCenterLat: true, mapCenterLng: true },
  });
  if (!trip) {
    return NextResponse.json({ error: "Trip not found" }, { status: 404 });
  }

  const body = await req.json();
  const history: ChatTurn[] = Array.isArray(body.history) ? body.history : [];
  const userText: string = (body.text ?? "").toString();
  const imageBase64: string | undefined = body.imageBase64 || undefined;
  const imageMime: string | undefined = body.imageMime || undefined;

  // Pull captions from any shared links in the user's message.
  let captions: string[] = [];
  let failedLinks: string[] = [];
  const urls = extractUrls(userText);
  if (urls.length > 0) {
    const r = await fetchCaptions(urls);
    captions = r.captions;
    failedLinks = r.failed;
  }

  let result;
  try {
    result = await runPlaceChat({
      destination: `${trip.destination}${trip.country ? `, ${trip.country}` : ""}`,
      history,
      userText,
      imageBase64,
      imageMime,
      captions,
    });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 502 });
  }

  // Enrich each extracted place via Google Places (best-effort) so it gets a
  // real address/coords/placeId and can show on the map.
  const bias =
    trip.mapCenterLat != null && trip.mapCenterLng != null
      ? { lat: trip.mapCenterLat, lng: trip.mapCenterLng }
      : undefined;

  const enriched: EnrichedPlace[] = await Promise.all(
    result.places.map(async (p): Promise<EnrichedPlace> => {
      try {
        const hits = await searchPlaces(
          `${p.name} ${trip.destination}`,
          bias
        );
        const top = hits[0];
        if (top) {
          return {
            ...p,
            address: top.address,
            lat: top.lat,
            lng: top.lng,
            placeId: top.placeId,
          };
        }
      } catch {
        // ignore — keep the name-only place
      }
      return p;
    })
  );

  return NextResponse.json({
    reply: result.reply,
    places: enriched,
    failedLinks,
  });
}
