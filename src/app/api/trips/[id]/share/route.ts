import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

type Params = { params: Promise<{ id: string }> };

// PATCH /api/trips/[id]/share — toggle isPublic status of a trip
export async function PATCH(req: NextRequest, { params }: Params) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: tripId } = await params;
  const { isPublic } = await req.json();

  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
  });

  if (!trip) {
    return NextResponse.json({ error: "Trip not found" }, { status: 404 });
  }

  if (trip.userId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const updated = await prisma.trip.update({
    where: { id: tripId },
    data: { isPublic: Boolean(isPublic) },
  });

  return NextResponse.json(updated);
}
