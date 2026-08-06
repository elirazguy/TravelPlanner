import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

// POST /api/trips/[id]/places — save a place to the trip's "Saved Places"
// collection (imported from Google Places search / Saved Places export).
export async function POST(req: NextRequest, { params }: Params) {
  const { id: tripId } = await params;
  const body = await req.json();
  if (!body.name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }
  const place = await prisma.savedPlace.create({
    data: {
      tripId,
      name: body.name,
      address: body.address ?? null,
      lat: body.lat ?? null,
      lng: body.lng ?? null,
      placeId: body.placeId ?? null,
      category: body.category ?? null,
      listName: body.listName ?? null,
      note: body.note ?? null,
      assignedDayId: body.assignedDayId ?? null,
    },
  });
  return NextResponse.json(place, { status: 201 });
}

// DELETE /api/trips/[id]/places?listName=... — remove an entire saved list.
export async function DELETE(req: NextRequest, { params }: Params) {
  const { id: tripId } = await params;
  const listName = req.nextUrl.searchParams.get("listName");
  if (!listName) {
    return NextResponse.json({ error: "listName is required" }, { status: 400 });
  }
  const { count } = await prisma.savedPlace.deleteMany({
    where: { tripId, listName },
  });
  return NextResponse.json({ deleted: count });
}
