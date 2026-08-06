import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { colorForDay } from "@/lib/constants";
import { daysBetween } from "@/lib/utils";

// GET /api/trips — list trips (optionally filtered by status).
export async function GET(req: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const status = req.nextUrl.searchParams.get("status");
  const trips = await prisma.trip.findMany({
    where: { userId: user.id, ...(status ? { status } : {}) },
    orderBy: { startDate: "desc" },
    include: { _count: { select: { days: true, documents: true } } },
  });
  return NextResponse.json(trips);
}

// POST /api/trips — create a trip and auto-generate its days with colors.
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { title, destination, country, startDate, endDate, notes, coverImage } =
    body;

  if (!title || !destination || !startDate || !endDate) {
    return NextResponse.json(
      { error: "title, destination, startDate and endDate are required" },
      { status: 400 }
    );
  }

  const start = new Date(startDate);
  const end = new Date(endDate);
  const totalDays = daysBetween(start, end) + 1;

  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const trip = await prisma.trip.create({
    data: {
      userId: user.id,
      title,
      destination,
      country: country ?? destination.split(",").pop()?.trim() ?? "",
      startDate: start,
      endDate: end,
      notes,
      coverImage,
      status: end < new Date() ? "ARCHIVED" : "PLANNING",
      days: {
        create: Array.from({ length: totalDays }).map((_, i) => {
          const d = new Date(start);
          d.setDate(d.getDate() + i);
          return {
            date: d,
            dayNumber: i + 1,
            colorHex: colorForDay(i + 1),
          };
        }),
      },
    },
    include: { days: true },
  });

  return NextResponse.json(trip, { status: 201 });
}
