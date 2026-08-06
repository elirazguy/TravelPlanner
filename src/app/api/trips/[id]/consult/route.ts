import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import {
  runItineraryAnalyzer,
  runPackingAssistant,
  runRecommendationChat,
  type TripContext,
} from "@/lib/consultant";
import { sortEventsChronologically } from "@/lib/utils";

type Params = { params: Promise<{ id: string }> };

// GET /api/trips/[id]/consult?skill=analyzer|packing
// Returns the persisted result for a skill (so the page doesn't regenerate it).
export async function GET(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const skill = req.nextUrl.searchParams.get("skill");
  if (skill !== "analyzer" && skill !== "packing") {
    return NextResponse.json({ result: null });
  }

  const user = await getSession();
  const userId = user?.id ?? null;

  // Try user-specific first if logged in, fallback to null userId
  let saved = null;
  if (userId) {
    saved = await prisma.consultResult.findFirst({
      where: { tripId: id, skill, userId },
    });
  }
  if (!saved) {
    saved = await prisma.consultResult.findFirst({
      where: { tripId: id, skill },
    });
  }

  return NextResponse.json({ result: saved?.content ?? null });
}

// POST /api/trips/[id]/consult
// body: { skill: "recommend" | "analyzer" | "packing", question?, messages? }
export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const { skill, question, messages } = await req.json();
  const user = await getSession();
  const userId = user?.id ?? null;

  const trip = await prisma.trip.findUnique({
    where: { id },
    include: {
      days: {
        orderBy: { dayNumber: "asc" },
        include: { events: true },
      },
      hotels: true,
      savedPlaces: true,
    },
  });

  if (!trip) {
    return NextResponse.json({ error: "Trip not found" }, { status: 404 });
  }

  const normName = (s: string) =>
    s.toLowerCase().replace(/["'`׳״.,\-־()]/g, "").replace(/\s+/g, "").trim();
  const plannedPlaceIds = new Set<string>();
  const plannedNames = new Set<string>();
  for (const d of trip.days) {
    for (const e of d.events) {
      if (e.placeId) plannedPlaceIds.add(e.placeId);
      if (e.locationName) plannedNames.add(normName(e.locationName));
      if (e.title) plannedNames.add(normName(e.title));
    }
  }
  const savedPlaces = trip.savedPlaces.map((p) => ({
    name: p.name,
    category: p.category,
    address: p.address,
    inPlan:
      (!!p.placeId && plannedPlaceIds.has(p.placeId)) ||
      plannedNames.has(normName(p.name)),
  }));

  const ctx: TripContext = {
    title: trip.title,
    destination: trip.destination,
    country: trip.country,
    startDate: trip.startDate.toISOString().slice(0, 10),
    endDate: trip.endDate.toISOString().slice(0, 10),
    notes: trip.notes,
    days: trip.days.map((d) => ({
      dayNumber: d.dayNumber,
      date: d.date.toISOString().slice(0, 10),
      events: sortEventsChronologically(d.events).map((e) => ({
        title: e.title,
        category: e.category,
        startTime: e.startTime,
        locationName: e.locationName,
        description: e.description,
      })),
    })),
    hotels: trip.hotels.map((h) => ({
      name: h.name,
      address: h.address,
      checkInDate: h.checkInDate?.toISOString().slice(0, 10) ?? null,
      checkOutDate: h.checkOutDate?.toISOString().slice(0, 10) ?? null,
    })),
    savedPlaces,
  };

  let permanentItems: string[] = [];
  if (skill === "packing") {
    const packingItems = await prisma.packingItem.findMany({
      where: userId ? { OR: [{ userId }, { userId: null }] } : {},
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    });
    permanentItems = packingItems.map((i) => i.text);
  }

  try {
    if (skill === "recommend") {
      const convo = Array.isArray(messages) ? messages : [];
      const reply = await runRecommendationChat(ctx, convo);
      return NextResponse.json({ reply });
    }

    let result: string;
    if (skill === "packing") {
      result = await runPackingAssistant(ctx, question, permanentItems);
    } else {
      result = await runItineraryAnalyzer(ctx, question);
    }

    // Persist per-user if userId exists
    if (userId) {
      await prisma.consultResult.upsert({
        where: { tripId_skill_userId: { tripId: id, skill, userId } },
        create: { tripId: id, skill, userId, content: result },
        update: { content: result },
      });
    } else {
      await prisma.consultResult.create({
        data: { tripId: id, skill, content: result },
      });
    }

    return NextResponse.json({ result });
  } catch (err) {
    const message = (err as Error).message;
    const isKeyMissing = message.includes("ANTHROPIC_API_KEY") || message.includes("GOOGLE_GEMINI_API_KEY");
    return NextResponse.json(
      {
        error: message,
        hint: isKeyMissing
          ? "Set GOOGLE_GEMINI_API_KEY or ANTHROPIC_API_KEY in your .env to enable the AI Travel Consultant."
          : undefined,
      },
      { status: isKeyMissing ? 400 : 502 }
    );
  }
}

// PATCH /api/trips/[id]/consult — update persisted content directly (e.g. checkbox state)
export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const { skill, content } = await req.json();
  const user = await getSession();
  const userId = user?.id ?? null;

  if (skill !== "analyzer" && skill !== "packing") {
    return NextResponse.json({ error: "Invalid skill" }, { status: 400 });
  }

  if (userId) {
    await prisma.consultResult.upsert({
      where: { tripId_skill_userId: { tripId: id, skill, userId } },
      create: { tripId: id, skill, userId, content },
      update: { content },
    });
  }

  return NextResponse.json({ result: content });
}
