import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

// POST /api/trips/[id]/flights — register a flight number to track.
export async function POST(req: NextRequest, { params }: Params) {
  const { id: tripId } = await params;
  const body = await req.json();
  if (!body.flightNumber) {
    return NextResponse.json(
      { error: "flightNumber is required" },
      { status: 400 }
    );
  }
  const flight = await prisma.flight.create({
    data: {
      tripId,
      flightNumber: String(body.flightNumber).toUpperCase().replace(/\s+/g, ""),
      airline: body.airline ?? null,
      departureAirport: body.departureAirport ?? null,
      arrivalAirport: body.arrivalAirport ?? null,
      flightDate: body.flightDate ? new Date(body.flightDate) : new Date(),
      notes: body.notes ?? null,
    },
  });
  return NextResponse.json(flight, { status: 201 });
}
