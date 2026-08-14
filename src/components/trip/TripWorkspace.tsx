"use client";

import { useEffect, useState } from "react";
import {
  CalendarRange,
  FolderLock,
  Map as MapIcon,
  Plane,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { TripDTO, DayDTO } from "@/lib/types";
import {
  useSetBackground,
  type BgKey,
} from "@/components/background/BackgroundProvider";
import { ItineraryPlanner } from "./ItineraryPlanner";
import { DocumentsVault } from "./DocumentsVault";
import { TripMap } from "./TripMap";
import { Logistics } from "./Logistics";
import { Consultation } from "./Consultation";
import { PlannerChat } from "./PlannerChat";

const TABS = [
  { id: "itinerary", label: "מסלול", icon: CalendarRange },
  { id: "logistics", label: "לוגיסטיקה", icon: Plane },
  { id: "documents", label: "מסמכים", icon: FolderLock },
  { id: "consult", label: "יועץ AI", icon: Sparkles },
] as const;

type TabId = (typeof TABS)[number]["id"];

const TAB_BACKGROUND: Record<TabId, BgKey> = {
  itinerary: "itinerary",
  logistics: "logistics",
  documents: "documents",
  consult: "consult",
};

export function TripWorkspace({ trip }: { trip: TripDTO }) {
  const [tab, setTab] = useState<TabId>("itinerary");
  const setBackground = useSetBackground();

  // Lift localDays here so both ItineraryPlanner and TripMap share the same state.
  // When an event is deleted or moved, ItineraryPlanner updates this, and TripMap
  // reflects the change immediately without waiting for a server round-trip.
  const [localDays, setLocalDays] = useState<DayDTO[]>(trip.days);
  useEffect(() => {
    setLocalDays(trip.days);
  }, [trip.days]);

  useEffect(() => {
    setBackground(TAB_BACKGROUND[tab]);
  }, [tab, setBackground]);

  const tripWithLocalDays: TripDTO = { ...trip, days: localDays };

  return (
    <div className="min-w-0 max-w-full overflow-x-clip">
      <div className="mb-5 flex items-center justify-between gap-1 rounded-xl border border-white/50 bg-white/60 p-1 overflow-x-auto thin-scroll backdrop-blur-xl shadow-glass max-w-full">
        <div className="flex items-center gap-1 w-full justify-between sm:justify-start">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  "relative flex flex-1 sm:flex-initial items-center justify-center gap-1 whitespace-nowrap rounded-lg px-2 sm:px-3.5 py-1.5 text-xs sm:text-sm font-bold transition-all",
                  active
                    ? "bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-sm"
                    : "text-ink-600 hover:bg-white/70 hover:text-ink-900"
                )}
              >
                <Icon size={14} className="shrink-0" />
                <span>{t.label}</span>
                {t.id === "consult" && (
                  <span
                    className={cn(
                      "rounded-full px-1 py-0.2 text-[9px] font-bold",
                      active ? "bg-white/25 text-white" : "bg-brand-100 text-brand-700"
                    )}
                  >
                    AI
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {tab === "itinerary" && (
        <div className="space-y-8 min-w-0">
          <ItineraryPlanner
            trip={trip}
            localDays={localDays}
            setLocalDays={setLocalDays}
          />
          <div className="pt-4 border-t border-white/40">
            <h2 className="mb-4 flex items-center gap-2 font-display text-xl font-bold text-ink-900">
              <MapIcon className="text-brand-600" size={22} />
              מפת היעדים והמסלול
            </h2>
            <TripMap trip={tripWithLocalDays} />
          </div>
        </div>
      )}
      {tab === "logistics" && <Logistics trip={trip} />}
      {tab === "documents" && <DocumentsVault trip={trip} />}
      {tab === "consult" && <Consultation tripId={trip.id} />}

      {/* Universal Floating AI Planner Bubble */}
      <PlannerChat tripId={trip.id} />
    </div>
  );
}
