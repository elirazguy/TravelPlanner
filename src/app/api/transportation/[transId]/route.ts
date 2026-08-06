import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ transId: string }> };

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { transId } = await params;
  await prisma.transportation.delete({ where: { id: transId } });
  return NextResponse.json({ ok: true });
}
