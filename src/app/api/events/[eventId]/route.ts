import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ eventId: string }> };

// PATCH /api/events/[eventId] — edit an event.
export async function PATCH(req: NextRequest, { params }: Params) {
  const { eventId } = await params;
  const body = await req.json();
  const data: Record<string, unknown> = {};
  for (const key of [
    "title",
    "description",
    "startTime",
    "endTime",
    "category",
    "locationName",
    "address",
    "lat",
    "lng",
    "placeId",
    "orderIndex",
    "dayId",
  ]) {
    if (key in body) data[key] = body[key];
  }
  const event = await prisma.event.update({ where: { id: eventId }, data });
  return NextResponse.json(event);
}

// DELETE /api/events/[eventId]
export async function DELETE(_req: NextRequest, { params }: Params) {
  const { eventId } = await params;
  await prisma.event.delete({ where: { id: eventId } });
  return NextResponse.json({ ok: true });
}
