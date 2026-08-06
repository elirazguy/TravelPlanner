import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

// POST /api/trips/[id]/hotels — add a hotel/accommodation.
export async function POST(req: NextRequest, { params }: Params) {
  const { id: tripId } = await params;
  const body = await req.json();
  if (!body.name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }
  const hotel = await prisma.hotel.create({
    data: {
      tripId,
      name: body.name,
      address: body.address ?? null,
      phone: body.phone ?? null,
      website: body.website ?? null,
      confirmationNumber: body.confirmationNumber ?? null,
      checkInDate: body.checkInDate ? new Date(body.checkInDate) : null,
      checkOutDate: body.checkOutDate ? new Date(body.checkOutDate) : null,
      lat: body.lat ?? null,
      lng: body.lng ?? null,
      notes: body.notes ?? null,
    },
  });
  return NextResponse.json(hotel, { status: 201 });
}
