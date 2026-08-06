import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, destroySession } from "@/lib/session";

// GET current user profile
export async function GET() {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  return NextResponse.json({
    id: user.id,
    name: user.name,
    email: user.email,
    picture: user.picture,
  });
}

// PATCH update user profile (name, picture)
export async function PATCH(req: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, picture } = await req.json();

  const updated = await prisma.userAccount.update({
    where: { id: user.id },
    data: {
      ...(name !== undefined ? { name } : {}),
      ...(picture !== undefined ? { picture } : {}),
    },
  });

  return NextResponse.json(updated);
}

// DELETE user account and all their trips/data
export async function DELETE() {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Prisma cascade delete will remove Trips, PackingItems, Sessions, etc.
  await prisma.userAccount.delete({
    where: { id: user.id },
  });

  await destroySession();
  return NextResponse.json({ success: true });
}
