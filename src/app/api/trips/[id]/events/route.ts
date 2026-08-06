import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

// POST /api/trips/[id]/events — add an event to a day.
export async function POST(req: NextRequest, { params }: Params) {
  const { id: tripId } = await params;
  const body = await req.json();
  const { dayId } = body;

  if (!dayId || !body.title) {
    return NextResponse.json(
      { error: "dayId and title are required" },
      { status: 400 }
    );
  }

  // Ensure the day belongs to this trip.
  const day = await prisma.day.findFirst({ where: { id: dayId, tripId } });
  if (!day) {
    return NextResponse.json({ error: "Day not found for trip" }, { status: 404 });
  }

  const count = await prisma.event.count({ where: { dayId } });

  const event = await prisma.event.create({
    data: {
      dayId,
      title: body.title,
      description: body.description ?? null,
      startTime: body.startTime ?? null,
      endTime: body.endTime ?? null,
      category: body.category ?? "ACTIVITY",
      locationName: body.locationName ?? null,
      address: body.address ?? null,
      lat: body.lat ?? null,
      lng: body.lng ?? null,
      placeId: body.placeId ?? null,
      orderIndex: count,
    },
  });

  return NextResponse.json(event, { status: 201 });
}
