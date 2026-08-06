import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

// GET /api/trips/[id] — full trip with all relations.
export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const trip = await prisma.trip.findUnique({
    where: { id },
    include: {
      days: {
        orderBy: { dayNumber: "asc" },
        include: { events: true, savedPlaces: true },
      },
      documents: { orderBy: { uploadedAt: "desc" } },
      hotels: { orderBy: { checkInDate: "asc" } },
      flights: { orderBy: { flightDate: "asc" } },
      savedPlaces: true,
    },
  });
  if (!trip) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(trip);
}

// PATCH /api/trips/[id] — update trip fields (incl. status -> archive).
export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await req.json();
  const data: Record<string, unknown> = {};
  for (const key of [
    "title",
    "destination",
    "country",
    "notes",
    "coverImage",
    "status",
    "mapCenterLat",
    "mapCenterLng",
  ]) {
    if (key in body) data[key] = body[key];
  }
  if (body.startDate) data.startDate = new Date(body.startDate);
  if (body.endDate) data.endDate = new Date(body.endDate);

  // If the destination changed but no explicit country was sent, re-derive the
  // country (text after the comma) so the wooden world map stays in sync.
  if ("destination" in body && !("country" in body) && typeof body.destination === "string") {
    data.country = body.destination.split(",").pop()?.trim() ?? "";
  }

  const trip = await prisma.trip.update({ where: { id }, data });
  return NextResponse.json(trip);
}

// DELETE /api/trips/[id]
export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  await prisma.trip.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
