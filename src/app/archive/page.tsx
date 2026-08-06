import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { TripCard } from "@/components/TripCard";
import { EmptyState } from "@/components/ui";
import { SetBackground } from "@/components/background/BackgroundProvider";
import { Archive } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ArchivePage() {
  const user = await getSession();
  if (!user) {
    redirect("/login");
  }

  const trips = await prisma.trip.findMany({
    where: { userId: user.id, status: "ARCHIVED" },
    orderBy: { startDate: "desc" },
    include: { _count: { select: { days: true, documents: true } } },
  });

  const serialized = trips.map((t) => ({
    ...t,
    startDate: t.startDate.toISOString(),
    endDate: t.endDate.toISOString(),
  }));

  return (
    <div>
      <SetBackground name="archive" />
      <div className="mb-6">
        <h1 className="font-display text-3xl font-extrabold text-ink-900">ארכיון טיולים</h1>
        <p className="mt-1 text-sm text-ink-500">
          תיעוד חזותי של כל מסע שהשלמת.
        </p>
      </div>

      {serialized.length === 0 ? (
        <EmptyState
          icon={<Archive size={40} />}
          title="אין טיולים בארכיון עדיין"
          hint="טיולים שהסתיימו יופיעו כאן אוטומטית לאחר תאריך הסיום, או כשתעביר אותם לארכיון."
        />
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {serialized.map((trip) => (
            <TripCard key={trip.id} trip={trip} />
          ))}
        </div>
      )}
    </div>
  );
}
