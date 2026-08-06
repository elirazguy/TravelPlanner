import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

type Params = { params: Promise<{ id: string }> };

// POST /api/trips/[id]/clone — clone a public trip into the current user's account
export async function POST(req: NextRequest, { params }: Params) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: originalTripId } = await params;
  const body = await req.json().catch(() => ({}));
  const newStartDateStr = body.startDate; // "YYYY-MM-DD"

  // Fetch original trip with days, events, and saved places
  const original = await prisma.trip.findUnique({
    where: { id: originalTripId },
    include: {
      days: {
        include: { events: true },
        orderBy: { dayNumber: "asc" },
      },
      savedPlaces: true,
    },
  });

  if (!original) {
    return NextResponse.json({ error: "Trip not found" }, { status: 404 });
  }

  if (!original.isPublic && original.userId !== user.id) {
    return NextResponse.json({ error: "Trip is private" }, { status: 403 });
  }

  // Calculate new start and end dates
  const origStart = new Date(original.startDate);
  const origEnd = new Date(original.endDate);
  const durationMs = origEnd.getTime() - origStart.getTime();

  let targetStart = newStartDateStr ? new Date(newStartDateStr) : new Date();
  if (isNaN(targetStart.getTime())) targetStart = new Date();

  const targetEnd = new Date(targetStart.getTime() + durationMs);
  const offsetMs = targetStart.getTime() - origStart.getTime();

  // Create new cloned trip
  const clonedTrip = await prisma.trip.create({
    data: {
      userId: user.id,
      title: `${original.title} (עותק)`,
      destination: original.destination,
      country: original.country,
      coverImage: original.coverImage,
      startDate: targetStart,
      endDate: targetEnd,
      status: "PLANNING",
      isPublic: false,
      mapCenterLat: original.mapCenterLat,
      mapCenterLng: original.mapCenterLng,
      notes: original.notes,
    },
  });

  // Map of old day ID -> new day ID
  const dayIdMap = new Map<string, string>();

  // Clone Days & Events
  for (const day of original.days) {
    const newDayDate = new Date(new Date(day.date).getTime() + offsetMs);
    const createdDay = await prisma.day.create({
      data: {
        tripId: clonedTrip.id,
        date: newDayDate,
        dayNumber: day.dayNumber,
        colorHex: day.colorHex,
        notes: day.notes,
      },
    });

    dayIdMap.set(day.id, createdDay.id);

    for (const ev of day.events) {
      await prisma.event.create({
        data: {
          dayId: createdDay.id,
          title: ev.title,
          description: ev.description,
          startTime: ev.startTime,
          endTime: ev.endTime,
          category: ev.category,
          locationName: ev.locationName,
          address: ev.address,
          lat: ev.lat,
          lng: ev.lng,
          placeId: ev.placeId,
          orderIndex: ev.orderIndex,
        },
      });
    }
  }

  // Clone Saved Places
  for (const sp of original.savedPlaces) {
    const newAssignedDayId = sp.assignedDayId ? dayIdMap.get(sp.assignedDayId) || null : null;
    await prisma.savedPlace.create({
      data: {
        tripId: clonedTrip.id,
        name: sp.name,
        address: sp.address,
        lat: sp.lat,
        lng: sp.lng,
        placeId: sp.placeId,
        category: sp.category,
        listName: sp.listName,
        note: sp.note,
        assignedDayId: newAssignedDayId,
      },
    });
  }

  // Increment original trip's cloneCount
  await prisma.trip.update({
    where: { id: originalTripId },
    data: { cloneCount: { increment: 1 } },
  });

  return NextResponse.json(clonedTrip, { status: 201 });
}
