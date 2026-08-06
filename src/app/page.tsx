import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { TripCard } from "@/components/TripCard";
import { NewTripModal } from "@/components/NewTripModal";
import { EmptyState } from "@/components/ui";
import { SetBackground } from "@/components/background/BackgroundProvider";
import { WoodWorldMap } from "@/components/WoodWorldMap";
import { resolveCountry } from "@/lib/countries";
import { MapPinned } from "lucide-react";
import { PublicLandingPage } from "@/components/PublicLandingPage";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await getSession();
  if (!user) {
    return <PublicLandingPage />;
  }

  let trips: any[] = [];
  let allTrips: any[] = [];
  let dbError = "";

  try {
    // Auto-archive trips whose end date has passed.
    await prisma.trip.updateMany({
      where: { userId: user.id, status: { not: "ARCHIVED" }, endDate: { lt: new Date() } },
      data: { status: "ARCHIVED" },
    });

    trips = await prisma.trip.findMany({
      where: {
        status: { not: "ARCHIVED" },
        OR: [
          { userId: user.id },
          { collaborators: { some: { userId: user.id } } },
        ],
      },
      orderBy: { startDate: "asc" },
      include: { _count: { select: { days: true, documents: true } } },
    });

    // Resolve every trip's country to ISO numeric codes for the wood world map:
    // archived (past) trips are "visited", everything else is "planned".
    allTrips = await prisma.trip.findMany({ 
      where: { userId: user.id },
      select: { country: true, status: true } 
    });
  } catch (error: any) {
    console.error("Database error in page.tsx:", error);
    dbError = error?.message || String(error);
  }

  if (dbError) {
    return (
      <div className="p-8 max-w-2xl mx-auto mt-12 bg-red-50 border border-red-200 rounded-xl" dir="rtl">
        <h2 className="text-xl font-bold text-red-600 mb-4">שגיאת התחברות למסד הנתונים</h2>
        <p className="text-sm text-zinc-700 mb-4">השרת לא הצליח לשלוף את הנתונים שלך ממסד הנתונים של Supabase.</p>
        <div className="bg-red-100 p-4 rounded text-left text-xs font-mono text-red-800 overflow-auto whitespace-pre-wrap" dir="ltr">
          {dbError}
        </div>
      </div>
    );
  }

  const serialized = trips.map((t) => ({
    ...t,
    startDate: t.startDate.toISOString(),
    endDate: t.endDate.toISOString(),
    isShared: t.userId !== user.id,
  }));

  const visitedNums = new Set<string>();
  const plannedNums = new Set<string>();
  for (const t of allTrips) {
    const c = resolveCountry(t.country);
    if (!c) continue;
    if (t.status === "ARCHIVED") visitedNums.add(c.num);
    else plannedNums.add(c.num);
  }
  // A country you've visited shouldn't also show as merely planned.
  for (const n of visitedNums) plannedNums.delete(n);

  return (
    <div>
      <SetBackground name="home" />
      <div className="-mt-3 mb-5 flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-extrabold text-ink-900">הטיולים שלך</h1>
          <p className="mt-0.5 text-xs md:text-sm text-ink-500">
            תכנן, ארגן ועקוב אחר כל מסע בינלאומי במקום אחד.
          </p>
        </div>
        <NewTripModal />
      </div>

      {serialized.length === 0 ? (
        <EmptyState
          icon={<MapPinned size={40} />}
          title="אין טיולים עדיין"
          hint="צור את הטיול הראשון שלך כדי להתחיל לתכנן מסלול, לאחסן מסמכים ולמפות את הכל."
        />
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {serialized.map((trip) => (
            <TripCard key={trip.id} trip={trip} />
          ))}
        </div>
      )}

      {/* Wooden world map of visited & planned countries */}
      <div className="mt-8">
        <WoodWorldMap
          visited={Array.from(visitedNums)}
          planned={Array.from(plannedNums)}
        />
      </div>
    </div>
  );
}
