import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ placeId: string }> };

// PATCH — assign a saved place to a day (or unassign with null).
export async function PATCH(req: NextRequest, { params }: Params) {
  const { placeId } = await params;
  const body = await req.json();
  const data: Record<string, unknown> = {};
  if ("assignedDayId" in body) data.assignedDayId = body.assignedDayId;
  if ("name" in body) data.name = body.name;
  const place = await prisma.savedPlace.update({
    where: { id: placeId },
    data,
  });
  return NextResponse.json(place);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { placeId } = await params;
  await prisma.savedPlace.delete({ where: { id: placeId } });
  return NextResponse.json({ ok: true });
}
