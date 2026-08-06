import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ flightId: string }> };

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { flightId } = await params;
  await prisma.flight.delete({ where: { id: flightId } });
  return NextResponse.json({ ok: true });
}
