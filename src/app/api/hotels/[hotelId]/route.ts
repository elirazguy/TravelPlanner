import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ hotelId: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const { hotelId } = await params;
  const body = await req.json();
  const data: Record<string, unknown> = {};
  for (const key of [
    "name",
    "address",
    "phone",
    "website",
    "confirmationNumber",
    "lat",
    "lng",
    "notes",
  ]) {
    if (key in body) data[key] = body[key];
  }
  if (body.checkInDate) data.checkInDate = new Date(body.checkInDate);
  if (body.checkOutDate) data.checkOutDate = new Date(body.checkOutDate);
  const hotel = await prisma.hotel.update({ where: { id: hotelId }, data });
  return NextResponse.json(hotel);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { hotelId } = await params;
  await prisma.hotel.delete({ where: { id: hotelId } });
  return NextResponse.json({ ok: true });
}
