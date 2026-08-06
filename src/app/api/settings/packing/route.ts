import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function GET() {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const items = await prisma.packingItem.findMany({ 
    where: { userId: user.id },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }] 
  });
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { text } = await req.json();
  if (!text?.trim()) return NextResponse.json({ error: "text is required" }, { status: 400 });
  const count = await prisma.packingItem.count({ where: { userId: user.id } });
  const item = await prisma.packingItem.create({ 
    data: { text: text.trim(), order: count, userId: user.id } 
  });
  return NextResponse.json(item, { status: 201 });
}
