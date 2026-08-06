"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MapPin, CalendarDays, FileText, CalendarRange, Trash2, Loader2 } from "lucide-react";
import { Badge } from "./ui";
import { formatDateRange, daysBetween } from "@/lib/utils";

export interface TripCardData {
  id: string;
  title: string;
  destination: string;
  coverImage: string | null;
  startDate: string | Date;
  endDate: string | Date;
  status: string;
  isShared?: boolean;
  _count?: { days: number; documents: number };
}

const STATUS_STYLE: Record<string, string> = {
  PLANNING: "bg-amber-100 text-amber-700 ring-amber-600/20",
  UPCOMING: "bg-emerald-100 text-emerald-700 ring-emerald-600/20",
  ARCHIVED: "bg-ink-100 text-ink-600 ring-ink-500/20",
};

const STATUS_LABEL: Record<string, string> = {
  PLANNING: "בתכנון",
  UPCOMING: "קרוב",
  ARCHIVED: "בארכיון",
};

export function TripCard({ trip }: { trip: TripCardData }) {
  const router = useRouter();
  const nights = daysBetween(trip.startDate, trip.endDate);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDeleting(true);
    await fetch(`/api/trips/${trip.id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="group relative">
      <Link
        href={`/trips/${trip.id}`}
        className="block overflow-hidden rounded-2xl border border-ink-200/70 bg-white shadow-card transition-all hover:-translate-y-0.5 hover:shadow-lg"
      >
        <div className="relative h-40 w-full overflow-hidden bg-gradient-to-br from-brand-500 to-brand-700">
          {trip.coverImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={trip.coverImage}
              alt={trip.destination}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-white/80">
              <MapPin size={36} />
            </div>
          )}
          <div className="absolute right-3 top-3 flex items-center gap-1.5">
            {trip.isShared && (
              <span className="rounded-full bg-indigo-600 px-2.5 py-0.5 text-[11px] font-extrabold text-white shadow-sm">
                👥 משותף
              </span>
            )}
            <Badge className={STATUS_STYLE[trip.status] ?? STATUS_STYLE.PLANNING}>
              {STATUS_LABEL[trip.status] ?? trip.status}
            </Badge>
          </div>
        </div>
        <div className="p-4">
          <h3 className="truncate text-base font-bold text-ink-900">{trip.title}</h3>
          <p className="mt-0.5 flex items-center gap-1 text-sm text-ink-500">
            <MapPin size={13} /> {trip.destination}
          </p>
          <div className="mt-3 flex items-center gap-3 text-xs text-ink-500">
            <span className="flex items-center gap-1">
              <CalendarDays size={13} /> {formatDateRange(trip.startDate, trip.endDate)}
            </span>
          </div>
          <div className="mt-2 flex items-center gap-3 text-xs text-ink-400">
            <span className="flex items-center gap-1">
              <CalendarRange size={13} /> {nights} {nights === 1 ? "לילה" : "לילות"}
            </span>
            {trip._count && (
              <span className="flex items-center gap-1">
                <FileText size={13} /> {trip._count.documents} מסמכים
              </span>
            )}
          </div>
        </div>
      </Link>

      {/* Delete overlay — appears on hover */}
      <div className="absolute left-3 top-3">
        {!confirmDelete ? (
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setConfirmDelete(true); }}
            className="rounded-full bg-black/40 p-1.5 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-rose-600"
            title="מחק טיול"
          >
            <Trash2 size={13} />
          </button>
        ) : (
          <div
            className="flex items-center gap-1 rounded-lg bg-rose-600 px-2 py-1 text-xs font-semibold text-white shadow-md"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
          >
            {deleting ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <>
                <button onClick={handleDelete} className="hover:underline">מחק</button>
                <span className="opacity-60">|</span>
                <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setConfirmDelete(false); }} className="hover:underline">ביטול</button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
