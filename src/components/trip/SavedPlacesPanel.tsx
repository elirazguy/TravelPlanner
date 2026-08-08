"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bookmark,
  Upload,
  Loader2,
  Trash2,
  Check,
  GripVertical,
  ListFilter,
  X,
  Sparkles,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";
import {
  SAVED_PLACE_CATEGORIES,
  SAVED_PLACE_CATEGORY_META,
  type SavedPlaceCategory,
} from "@/lib/constants";
import { parseTakeoutFile, listNameFromFile } from "@/lib/takeout";
import type { TripDTO, SavedPlaceDTO } from "@/lib/types";
import { PlaceChat } from "./PlaceChat";

const ALL = "__ALL__";

// Normalize a place/location name for loose matching between saved places and
// itinerary events (lowercase, strip punctuation/whitespace and Hebrew geresh).
function normName(s: string): string {
  return s
    .toLowerCase()
    .replace(/["'`׳״.,\-־()]/g, "")
    .replace(/\s+/g, "")
    .trim();
}

export function SavedPlacesPanel({ trip }: { trip: TripDTO }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [activeList, setActiveList] = useState<string>(ALL);
  const [activeCat, setActiveCat] = useState<SavedPlaceCategory | "ALL">("ALL");
  const [hideInPlan, setHideInPlan] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const places = trip.savedPlaces;
  const listNames = useMemo(() => {
    const set = new Set<string>();
    for (const p of places) if (p.listName) set.add(p.listName);
    return Array.from(set).sort();
  }, [places]);

  // A saved place counts as "in the plan" if it was dragged onto a day
  // (assignedDayId) OR an event already in the itinerary matches it — by
  // Google placeId, or by a normalized name match against an event's location
  // or title. This covers events added manually, not just via drag.
  const planned = useMemo(() => {
    const placeIds = new Set<string>();
    const names = new Set<string>();
    for (const d of trip.days) {
      for (const e of d.events) {
        if (e.placeId) placeIds.add(e.placeId);
        if (e.locationName) names.add(normName(e.locationName));
        if (e.title) names.add(normName(e.title));
      }
    }
    return { placeIds, names };
  }, [trip.days]);

  function isInPlan(p: SavedPlaceDTO): boolean {
    if (p.assignedDayId) return true;
    if (p.placeId && planned.placeIds.has(p.placeId)) return true;
    const n = normName(p.name);
    if (!n) return false;
    for (const name of planned.names) {
      if (name === n || name.includes(n) || n.includes(name)) return true;
    }
    return false;
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) await importFile(file);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function importFile(file: File) {
    setImportError(null);
    setImporting(true);
    try {
      const text = await file.text();
      const parsed = parseTakeoutFile(file.name, text);
      if (parsed.length === 0) {
        setImportError("לא נמצאו מקומות בקובץ. ודא שזה ייצוא רשימה מ-Google Takeout.");
        setImporting(false);
        return;
      }
      const suggested = listNameFromFile(file.name);
      const listName =
        typeof window !== "undefined"
          ? window.prompt("שם הרשימה:", suggested) ?? suggested
          : suggested;

      const res = await fetch(`/api/trips/${trip.id}/places/import`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listName, places: parsed }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setImportError(data.error ?? "הייבוא נכשל");
      } else {
        setActiveList(listName);
        router.refresh();
      }
    } catch {
      setImportError("לא ניתן לקרוא את הקובץ");
    }
    setImporting(false);
  }

  async function deleteList(listName: string) {
    if (!window.confirm(`למחוק את הרשימה "${listName}" וכל המקומות שבה?`)) return;
    await fetch(
      `/api/trips/${trip.id}/places?listName=${encodeURIComponent(listName)}`,
      { method: "DELETE" }
    );
    setActiveList(ALL);
    router.refresh();
  }

const HEBREW_TO_ENGLISH: Record<string, string> = {
  "/": "q", "'": "w", "ק": "e", "ר": "r", "א": "t", "ט": "y", "ו": "u", "ן": "i", "ם": "o", "פ": "p",
  "ש": "a", "ד": "s", "ג": "d", "כ": "f", "ע": "g", "י": "h", "ח": "j", "ל": "k", "ך": "l", "ף": ";", ",": "'",
  "ז": "z", "ס": "x", "ב": "c", "ה": "v", "נ": "b", "מ": "n", "צ": "m", "ת": ",", "ץ": "."
};

function qwertyHebrewToEnglish(str: string) {
  return str.split("").map(c => HEBREW_TO_ENGLISH[c] || c).join("");
}

  // Apply filters
  const filtered = places.filter((p) => {
    if (activeList !== ALL && (p.listName ?? "") !== activeList) return false;
    if (activeCat !== "ALL" && (p.category ?? "OTHER") !== activeCat) return false;
    if (hideInPlan && isInPlan(p)) return false;
    
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const mappedQ = qwertyHebrewToEnglish(q);
      const name = (p.name || "").toLowerCase();
      const address = (p.address || "").toLowerCase();
      if (!name.includes(q) && !address.includes(q) && !name.includes(mappedQ) && !address.includes(mappedQ)) {
        return false;
      }
    }
    return true;
  });

  // Per-category counts (within the active list scope) for the chips.
  const catScope = places.filter((p) => {
    if (activeList !== ALL && (p.listName ?? "") !== activeList) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const mappedQ = qwertyHebrewToEnglish(q);
      const name = (p.name || "").toLowerCase();
      const address = (p.address || "").toLowerCase();
      if (!name.includes(q) && !address.includes(q) && !name.includes(mappedQ) && !address.includes(mappedQ)) {
        return false;
      }
    }
    return true;
  });
  const catCounts: Record<string, number> = {};
  for (const p of catScope) {
    const c = (p.category ?? "OTHER") as string;
    catCounts[c] = (catCounts[c] ?? 0) + 1;
  }

  const inPlanCount = catScope.filter((p) => isInPlan(p)).length;

  return (
    <div className="rounded-2xl border border-white/60 bg-white/85 p-4 shadow-card backdrop-blur-md">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <h3 className="me-auto flex items-center gap-1.5 text-sm font-bold text-ink-900">
          <Bookmark size={15} className="text-brand-600" /> מקומות שמורים
        </h3>
        <Button size="sm" onClick={() => setChatOpen(true)}>
          <Sparkles size={13} /> צ׳אט AI
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => fileRef.current?.click()}
          disabled={importing}
        >
          {importing ? (
            <Loader2 size={13} className="animate-spin" />
          ) : (
            <Upload size={13} />
          )}
          {importing ? "מסווג..." : "ייבוא"}
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept=".csv,.json,.geojson"
          onChange={onFile}
          className="hidden"
        />
      </div>

      <div className="mb-4 relative">
        <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none text-ink-400">
          <Search size={14} />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="חיפוש מקומות..."
          className="w-full bg-white border border-ink-200 rounded-lg py-1.5 ps-9 pe-3 text-xs focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all placeholder:text-ink-400"
        />
      </div>

      {chatOpen && (
        <PlaceChat tripId={trip.id} onClose={() => setChatOpen(false)} />
      )}

      {/* Empty state with instructions */}
      {places.length === 0 && !importing && (
        <div className="rounded-xl border border-dashed border-ink-200 bg-white/60 px-3 py-4 text-center">
          <p className="text-xs font-medium text-ink-700">אין עדיין מקומות שמורים</p>
          <p className="mt-1 text-[11px] leading-relaxed text-ink-400">
            ייצא רשימה שמורה מ-Google Maps דרך{" "}
            <a
              href="https://takeout.google.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-600 underline"
            >
              Google Takeout
            </a>{" "}
            (קובץ CSV או GeoJSON) ולחץ על <strong>ייבוא</strong>, או פתח{" "}
            <strong>צ׳אט AI</strong> כדי לבנות רשימה משיחה, צילום מסך או קישור
            לריל/טיקטוק. ה-AI יסווג אוטומטית למלונות, אטרקציות, פעילויות ואוכל.
          </p>
        </div>
      )}

      {importError && (
        <p className="mb-2 rounded-lg bg-rose-50 px-2 py-1.5 text-[11px] text-rose-600">
          {importError}
        </p>
      )}

      {places.length > 0 && (
        <>
          {/* List selector */}
          {listNames.length > 0 && (
            <div className="mb-2 flex items-center gap-2">
              <ListFilter size={13} className="shrink-0 text-ink-400" />
              <select
                value={activeList}
                onChange={(e) => setActiveList(e.target.value)}
                className="min-w-0 flex-1 rounded-lg border border-ink-200 bg-white px-2 py-1.5 text-xs text-ink-700"
              >
                <option value={ALL}>כל הרשימות ({places.length})</option>
                {listNames.map((ln) => (
                  <option key={ln} value={ln}>
                    {ln} ({places.filter((p) => (p.listName ?? "") === ln).length})
                  </option>
                ))}
              </select>
              {activeList !== ALL && (
                <button
                  onClick={() => deleteList(activeList)}
                  className="rounded p-1 text-ink-300 hover:bg-rose-50 hover:text-rose-500"
                  title="מחק רשימה"
                >
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          )}

          {/* Category chips */}
          <div className="mb-2 flex flex-wrap gap-1">
            <CatChip
              label="הכל"
              active={activeCat === "ALL"}
              count={catScope.length}
              onClick={() => setActiveCat("ALL")}
            />
            {SAVED_PLACE_CATEGORIES.map((c) => {
              const count = catCounts[c] ?? 0;
              if (count === 0) return null;
              return (
                <CatChip
                  key={c}
                  label={`${SAVED_PLACE_CATEGORY_META[c].emoji} ${SAVED_PLACE_CATEGORY_META[c].label}`}
                  active={activeCat === c}
                  count={count}
                  onClick={() => setActiveCat(c)}
                />
              );
            })}
          </div>

          {/* In-plan toggle */}
          <label className="mb-2 flex cursor-pointer items-center gap-1.5 text-[11px] text-ink-500">
            <input
              type="checkbox"
              checked={hideInPlan}
              onChange={(e) => setHideInPlan(e.target.checked)}
              className="h-3 w-3 accent-brand-600"
            />
            הצג רק מה שעדיין לא בתוכנית
            <span className="text-ink-400">
              ({inPlanCount}/{catScope.length} בתוכנית)
            </span>
          </label>

          {/* Places list */}
          <div className="max-h-[60vh] space-y-1.5 overflow-y-auto thin-scroll pe-1">
            {filtered.length === 0 ? (
              <p className="py-4 text-center text-xs text-ink-400">
                אין מקומות שתואמים לסינון.
              </p>
            ) : (
              filtered.map((p) => (
                <SavedPlaceCard key={p.id} place={p} tripId={trip.id} inPlan={isInPlan(p)} />
              ))
            )}
          </div>

          <p className="mt-2 text-center text-[10px] text-ink-400">
            גרור מקום אל יום במסלול כדי להוסיף אותו לתוכנית
          </p>
        </>
      )}
    </div>
  );
}

function CatChip({
  label,
  active,
  count,
  onClick,
}: {
  label: string;
  active: boolean;
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-full px-2 py-0.5 text-[11px] font-medium transition-colors",
        active
          ? "bg-brand-600 text-white"
          : "bg-ink-100 text-ink-600 hover:bg-ink-200"
      )}
    >
      {label} <span className="opacity-70">{count}</span>
    </button>
  );
}

function SavedPlaceCard({
  place,
  tripId,
  inPlan,
}: {
  place: SavedPlaceDTO;
  tripId: string;
  inPlan: boolean;
}) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const meta =
    SAVED_PLACE_CATEGORY_META[(place.category ?? "OTHER") as SavedPlaceCategory] ??
    SAVED_PLACE_CATEGORY_META.OTHER;

  async function remove() {
    setDeleting(true);
    await fetch(`/api/places/${place.id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("application/x-saved-place", place.id);
        e.dataTransfer.effectAllowed = "copy";
      }}
      className={cn(
        "group flex cursor-grab items-start gap-2 rounded-lg border bg-white px-2.5 py-2 active:cursor-grabbing",
        inPlan ? "border-emerald-200 bg-emerald-50/40" : "border-ink-100"
      )}
    >
      <GripVertical
        size={13}
        className="mt-0.5 shrink-0 text-ink-200 group-hover:text-ink-400"
      />
      <span className="text-base leading-none">{meta.emoji}</span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-xs font-semibold text-ink-900">
          {place.name}
        </div>
        {place.address && (
          <div className="truncate text-[10px] text-ink-400">{place.address}</div>
        )}
        {inPlan && (
          <span className="mt-0.5 inline-flex items-center gap-0.5 text-[10px] font-medium text-emerald-600">
            <Check size={10} /> בתוכנית
          </span>
        )}
      </div>
      <button
        onClick={remove}
        disabled={deleting}
        className="rounded p-0.5 text-ink-300 opacity-0 transition hover:bg-rose-50 hover:text-rose-500 group-hover:opacity-100"
      >
        {deleting ? (
          <Loader2 size={12} className="animate-spin" />
        ) : (
          <X size={12} />
        )}
      </button>
    </div>
  );
}
