import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { classifySavedPlaces } from "@/lib/consultant";

type Params = { params: Promise<{ id: string }> };

interface IncomingPlace {
  name: string;
  address?: string | null;
  lat?: number | null;
  lng?: number | null;
  placeId?: string | null;
  note?: string | null;
  category?: string | null;
}

const VALID_CATEGORIES = ["HOTEL", "ATTRACTION", "ACTIVITY", "FOOD", "OTHER"];

// POST /api/trips/[id]/places/import — bulk-import places into a saved list.
// Used by both the Google Takeout import and the AI place chat. Places that
// arrive without a category are classified by the AI into
// HOTEL/ATTRACTION/ACTIVITY/FOOD/OTHER; places that already carry a valid
// category (e.g. from Gemini in the chat) keep it.
export async function POST(req: NextRequest, { params }: Params) {
  const { id: tripId } = await params;
  const body = await req.json();
  const listName: string = (body.listName ?? "רשימה").toString();
  const incoming: IncomingPlace[] = Array.isArray(body.places) ? body.places : [];

  const cleaned = incoming
    .filter((p) => p && typeof p.name === "string" && p.name.trim())
    .map((p) => ({
      name: p.name.trim(),
      address: p.address ?? null,
      lat: typeof p.lat === "number" ? p.lat : null,
      lng: typeof p.lng === "number" ? p.lng : null,
      placeId: p.placeId ?? null,
      note: p.note ?? null,
      category:
        p.category && VALID_CATEGORIES.includes(String(p.category).toUpperCase())
          ? String(p.category).toUpperCase()
          : null,
    }));

  if (cleaned.length === 0) {
    return NextResponse.json({ error: "no valid places found" }, { status: 400 });
  }

  // Classify only the places missing a category. If the AI call fails (e.g. no
  // API key), fall back to OTHER so the import still succeeds.
  const needClassify = cleaned.filter((p) => !p.category);
  if (needClassify.length > 0) {
    let categories: string[];
    try {
      categories = await classifySavedPlaces(
        needClassify.map((p) => ({ name: p.name, address: p.address }))
      );
    } catch {
      categories = needClassify.map(() => "OTHER");
    }
    needClassify.forEach((p, i) => {
      p.category = categories[i] ?? "OTHER";
    });
  }

  await prisma.savedPlace.createMany({
    data: cleaned.map((p) => ({
      tripId,
      name: p.name,
      address: p.address,
      lat: p.lat,
      lng: p.lng,
      placeId: p.placeId,
      note: p.note,
      listName,
      category: p.category ?? "OTHER",
    })),
  });

  const created = await prisma.savedPlace.findMany({
    where: { tripId, listName },
    orderBy: { name: "asc" },
  });
  return NextResponse.json({ imported: cleaned.length, places: created }, { status: 201 });
}
