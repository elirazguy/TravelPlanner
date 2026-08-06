import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fetchLiveFlight } from "@/lib/flights";

type Params = { params: Promise<{ flightId: string }> };

// GET /api/flights/[flightId]/status — live tracking lookup for a stored flight.
export async function GET(_req: NextRequest, { params }: Params) {
  const { flightId } = await params;
  const flight = await prisma.flight.findUnique({ where: { id: flightId } });
  if (!flight) {
    return NextResponse.json({ error: "Flight not found" }, { status: 404 });
  }
  try {
    const status = await fetchLiveFlight(
      flight.flightNumber,
      flight.flightDate.toISOString()
    );
    return NextResponse.json(status);
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 502 }
    );
  }
}
