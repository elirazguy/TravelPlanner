import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const items = await prisma.transportation.findMany({
    where: { tripId: id },
    orderBy: { date: "asc" },
  });
  return NextResponse.json(items);
}

export async function POST(req: NextRequest, { params }: Params) {
  const { id: tripId } = await params;
  const body = await req.json();
  if (!body.type) return NextResponse.json({ error: "type is required" }, { status: 400 });

  const item = await prisma.transportation.create({
    data: {
      tripId,
      type: body.type,
      date: body.date ? new Date(body.date) : null,
      fromLocation: body.fromLocation ?? null,
      toLocation: body.toLocation ?? null,
      departureTime: body.departureTime ?? null,
      arrivalTime: body.arrivalTime ?? null,
      company: body.company ?? null,
      reference: body.reference ?? null,
      vehicle: body.vehicle ?? null,
      documents: body.documents ?? null,
      contactName: body.contactName ?? null,
      contactPhone: body.contactPhone ?? null,
      notes: body.notes ?? null,
    },
  });
  return NextResponse.json(item, { status: 201 });
}
