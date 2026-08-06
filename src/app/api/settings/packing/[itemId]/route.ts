import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

type Params = { params: Promise<{ itemId: string }> };

export async function DELETE(_req: NextRequest, { params }: Params) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { itemId } = await params;
  
  // ensure it belongs to the user
  const item = await prisma.packingItem.findUnique({ where: { id: itemId } });
  if (!item || item.userId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.packingItem.delete({ where: { id: itemId } });
  return NextResponse.json({ ok: true });
}
