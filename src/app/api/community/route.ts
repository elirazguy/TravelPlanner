import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/community — fetch public trips shared by users
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const q = searchParams.get("q")?.toLowerCase() || "";
  const country = searchParams.get("country") || "";

  try {
    const trips = await prisma.trip.findMany({
      where: {
        isPublic: true,
        ...(country ? { country: { equals: country } } : {}),
        ...(q
          ? {
              OR: [
                { title: { contains: q } },
                { destination: { contains: q } },
                { country: { contains: q } },
              ],
            }
          : {}),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            picture: true,
          },
        },
        days: {
          select: { id: true },
        },
        savedPlaces: {
          select: { id: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const formatted = trips.map((t) => ({
      id: t.id,
      title: t.title,
      destination: t.destination,
      country: t.country,
      coverImage: t.coverImage,
      startDate: t.startDate,
      endDate: t.endDate,
      cloneCount: t.cloneCount,
      daysCount: t.days.length,
      placesCount: t.savedPlaces.length,
      author: {
        name: t.user?.name || "מטייל בקהילה",
        picture: t.user?.picture || null,
      },
    }));

    return NextResponse.json(formatted);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
