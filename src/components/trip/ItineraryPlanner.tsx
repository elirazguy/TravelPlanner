"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Trash2,
  Clock,
  MapPin,
  Loader2,
  X,
  Search,
  GripVertical,
  Pencil,
  Bed,
} from "lucide-react";
import { Button, Card, Input } from "@/components/ui";
import {
  EVENT_CATEGORIES,
  EVENT_CATEGORY_META,
  SAVED_PLACE_CATEGORY_META,
  type EventCategory,
  type SavedPlaceCategory,
} from "@/lib/constants";
import { cn, formatDate, sortEventsChronologically } from "@/lib/utils";
import type { TripDTO, EventDTO } from "@/lib/types";
import type { PlaceResult } from "@/lib/places";
import { SavedPlacesPanel } from "./SavedPlacesPanel";
import { PlannerChat } from "./PlannerChat";
import { NavButtons } from "@/components/NavButtons";

// 15-minute interval time options
const TIME_OPTIONS = Array.from({ length: 24 * 4 }, (_, i) => {
  const h = Math.floor(i / 4).toString().padStart(2, "0");
  const m = ((i % 4) * 15).toString().padStart(2, "0");
  return `${h}:${m}`;
});

export function ItineraryPlanner({ trip }: { trip: TripDTO }) {
  const router = useRouter();
  const [addingFor, setAddingFor] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverDayId, setDragOverDayId] = useState<string | null>(null);

  const [localDays, setLocalDays] = useState(trip.days);
  useEffect(() => {
    setLocalDays(trip.days);
  }, [trip.days]);

  const mapBias = {
    lat: trip.mapCenterLat ?? undefined,
    lng: trip.mapCenterLng ?? undefined,
  };

  async function moveEventToDay(eventId: string, targetDayId: string) {
    const targetDay = localDays.find((d) => d.id === targetDayId);
    
    // Optimistic UI update
    setLocalDays(prev => {
      const next = prev.map(d => ({ ...d, events: [...d.events] }));
      let moved: any = null;
      for (const d of next) {
        const idx = d.events.findIndex(e => e.id === eventId);
        if (idx !== -1) {
          moved = d.events[idx];
          d.events.splice(idx, 1);
        }
      }
      if (moved) {
        const tgt = next.find(d => d.id === targetDayId);
        if (tgt) tgt.events.push({ ...moved, dayId: targetDayId, orderIndex: 999 });
      }
      return next;
    });

    const maxOrder = targetDay
      ? Math.max(0, ...targetDay.events.map((e) => e.orderIndex ?? 0))
      : 0;
    await fetch(`/api/events/${eventId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dayId: targetDayId, orderIndex: maxOrder + 1 }),
    });
    router.refresh();
  }

  // A saved place dragged from the panel onto a day → create an event in that
  // day and mark the saved place as "in plan" (assignedDayId).
  async function addSavedPlaceToDay(savedPlaceId: string, targetDayId: string) {
    const place = trip.savedPlaces.find((p) => p.id === savedPlaceId);
    if (!place) return;
    const bucket = (place.category ?? "OTHER") as SavedPlaceCategory;
    const eventCategory =
      SAVED_PLACE_CATEGORY_META[bucket]?.eventCategory ?? "OTHER";

    // Optimistic UI update
    setLocalDays(prev => prev.map(d => {
      if (d.id === targetDayId) {
        return {
          ...d,
          events: [...d.events, {
            id: `temp-${Date.now()}`,
            dayId: targetDayId,
            title: place.name,
            category: eventCategory,
            locationName: place.name,
            address: place.address,
            lat: place.lat,
            lng: place.lng,
            placeId: place.placeId,
            orderIndex: 999,
            description: null,
            startTime: null,
            endTime: null,
          } as EventDTO]
        };
      }
      return d;
    }));

    await fetch(`/api/trips/${trip.id}/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        dayId: targetDayId,
        title: place.name,
        category: eventCategory,
        locationName: place.name,
        address: place.address,
        lat: place.lat,
        lng: place.lng,
        placeId: place.placeId,
      }),
    });
    await fetch(`/api/places/${savedPlaceId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assignedDayId: targetDayId }),
    });
    router.refresh();
  }

  async function swapEventOrder(
    draggedId: string,
    targetId: string,
    dayId: string,
    dayEvents: EventDTO[]
  ) {
    // Optimistic update
    setLocalDays(prev => {
      const next = prev.map(d => ({ ...d, events: [...d.events] }));
      const targetDay = next.find(d => d.id === dayId);
      if (targetDay) {
        let draggedEvent: any = null;
        for (const d of next) {
          const idx = d.events.findIndex(e => e.id === draggedId);
          if (idx !== -1) {
            draggedEvent = d.events[idx];
            d.events.splice(idx, 1);
          }
        }
        if (draggedEvent) {
          const tgtIdx = targetDay.events.findIndex(e => e.id === targetId);
          if (tgtIdx !== -1) {
             targetDay.events.splice(tgtIdx, 0, { ...draggedEvent, dayId });
          } else {
             targetDay.events.push({ ...draggedEvent, dayId });
          }
        }
      }
      return next;
    });

    const dragged = dayEvents.find((e) => e.id === draggedId);
    const target = dayEvents.find((e) => e.id === targetId);
    if (!target) return;

    if (!dragged) {
      // Cross-day: move dragged event into this day near the target
      await fetch(`/api/events/${draggedId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dayId,
          orderIndex: Math.max(0, (target.orderIndex ?? 0) - 1),
        }),
      });
    } else {
      // Same-day: swap orderIndex with target
      await Promise.all([
        fetch(`/api/events/${draggedId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderIndex: target.orderIndex }),
        }),
        fetch(`/api/events/${targetId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderIndex: dragged.orderIndex }),
        }),
      ]);
    }
    router.refresh();
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
      <div className="space-y-5">
        <p className="text-sm text-ink-500">
          בנה ציר זמן יומי. האירועים ממוינים כרונולוגית לפי שעה, וכל מיקום שתצרף מסונכרן למפה ומקבל קידוד צבע לפי יום.
        </p>

      {localDays.map((day) => {
        // Inject flights for this day
        const dayDateObj = new Date(day.date);
        const dayStr = dayDateObj.toISOString().split("T")[0];
        
        const dayFlights = trip.flights?.filter(f => {
           if (!f.flightDate) return false;
           return new Date(f.flightDate).toISOString().split("T")[0] === dayStr;
        }) || [];

        const syntheticFlightEvents = dayFlights.map(f => {
           const timeStr = f.flightDate.includes("T") ? f.flightDate.split("T")[1].substring(0, 5) : null;
           return {
              id: `flight-${f.id}`,
              dayId: day.id,
              title: `טיסה: ${f.airline || ""} ${f.flightNumber}`,
              category: "OTHER",
              description: `המראה: ${f.departureAirport || "לא ידוע"} ➔ נחיתה: ${f.arrivalAirport || "לא ידוע"}`,
              startTime: timeStr,
              endTime: null,
              orderIndex: -1,
              locationName: null,
              address: null,
              lat: null,
              lng: null,
              placeId: null,
              isReadOnly: true,
           } as EventDTO & { isReadOnly?: boolean };
        });

        const events = sortEventsChronologically([...day.events, ...syntheticFlightEvents]);
        const isDragOver = dragOverDayId === day.id;

        return (
          <div
            key={day.id}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOverDayId(day.id);
            }}
            onDragLeave={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                setDragOverDayId(null);
              }
            }}
            onDrop={(e) => {
              e.preventDefault();
              setDragOverDayId(null);
              setDraggingId(null);
              // Saved place dragged from the panel?
              const savedPlaceId = e.dataTransfer.getData("application/x-saved-place");
              if (savedPlaceId) {
                addSavedPlaceToDay(savedPlaceId, day.id);
                return;
              }
              const eventId = e.dataTransfer.getData("text/plain");
              if (!eventId) return;
              const alreadyHere = day.events.some((ev) => ev.id === eventId);
              if (!alreadyHere) moveEventToDay(eventId, day.id);
            }}
          >
            <Card
              className={cn(
                "overflow-hidden transition-all duration-150",
                isDragOver && "ring-2 ring-brand-400 ring-offset-2"
              )}
            >
              <div className="flex items-center justify-between border-b border-ink-100 bg-ink-50/60 px-4 py-3">
                <div className="flex items-center gap-3">
                  <span
                    className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white"
                    style={{ backgroundColor: day.colorHex }}
                  >
                    {day.dayNumber}
                  </span>
                  <div>
                    <div className="text-sm font-bold text-ink-900">יום {day.dayNumber}</div>
                    <div className="text-xs text-ink-500">
                      {formatDate(day.date, { weekday: "long" })}
                    </div>
                  </div>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() =>
                    setAddingFor(addingFor === day.id ? null : day.id)
                  }
                >
                  <Plus size={14} /> הוסף אירוע
                </Button>
              </div>

              <div className="px-4 py-3 flex flex-col gap-3">
                {(() => {
                  const dayDateObj = new Date(day.date);
                  const dayStr = dayDateObj.toISOString().split("T")[0];
                  
                  const hotelForDay = trip.hotels?.find((h) => {
                    if (!h.checkInDate || !h.checkOutDate) return false;
                    const checkInStr = new Date(h.checkInDate).toISOString().split("T")[0];
                    const checkOutStr = new Date(h.checkOutDate).toISOString().split("T")[0];
                    return dayStr >= checkInStr && dayStr < checkOutStr;
                  });

                  const isCheckInDay = hotelForDay?.checkInDate 
                    ? dayStr === new Date(hotelForDay.checkInDate).toISOString().split("T")[0]
                    : false;

                  let checkInTimeStr = "";
                  if (isCheckInDay && hotelForDay?.checkInDate && hotelForDay.checkInDate.includes("T")) {
                     const timePart = hotelForDay.checkInDate.split("T")[1];
                     if (!timePart.startsWith("00:00:00")) {
                         checkInTimeStr = timePart.substring(0, 5);
                     }
                  }

                  if (hotelForDay) {
                    return (
                      <div className="flex flex-col gap-1 rounded-xl bg-violet-50 px-3 py-2 border border-violet-100">
                        <div className="flex items-center gap-2 text-sm font-medium text-violet-900">
                          <Bed size={16} className="text-violet-600" />
                          ישנים במלון: {hotelForDay.name}
                        </div>
                        {isCheckInDay && (
                          <div className="flex items-center gap-1.5 text-xs text-violet-700 font-medium mr-6">
                            <span className="w-1.5 h-1.5 rounded-full bg-violet-400"></span>
                            צ'ק-אין במלון {checkInTimeStr ? `בשעה ${checkInTimeStr}` : "היום"}
                          </div>
                        )}
                      </div>
                    );
                  }
                  return null;
                })()}

                {events.length === 0 && addingFor !== day.id && (
                  <p className="py-2 text-center text-sm text-ink-400">
                    לא תוכנן עדיין דבר.
                  </p>
                )}

                <ol className="relative space-y-2">
                  {events.map((event) => (
                    <EventRow
                      key={event.id}
                      event={event}
                      dayEvents={events}
                      mapBias={mapBias}
                      draggingId={draggingId}
                      onChange={() => router.refresh()}
                      onDragStart={(id) => setDraggingId(id)}
                      onDragEnd={() => {
                        setDraggingId(null);
                        setDragOverDayId(null);
                      }}
                      onDropOnEvent={(draggedId, targetId) =>
                        swapEventOrder(draggedId, targetId, day.id, events)
                      }
                    />
                  ))}
                </ol>

                {addingFor === day.id && (
                  <AddEventForm
                    tripId={trip.id}
                    dayId={day.id}
                    mapBias={mapBias}
                    onDone={() => {
                      setAddingFor(null);
                      router.refresh();
                    }}
                    onCancel={() => setAddingFor(null)}
                  />
                )}
              </div>
            </Card>
          </div>
        );
      })}
      </div>

      {/* Saved places panel */}
      <div className="lg:sticky lg:top-4 self-start">
        <SavedPlacesPanel trip={trip} />
      </div>
    </div>
  );
}

// ─── EventRow ────────────────────────────────────────────────────────────────

function EventRow({
  event,
  dayEvents,
  mapBias,
  draggingId,
  onChange,
  onDragStart,
  onDragEnd,
  onDropOnEvent,
}: {
  event: EventDTO & { isReadOnly?: boolean };
  dayEvents: EventDTO[];
  mapBias: { lat?: number; lng?: number };
  draggingId: string | null;
  onChange: () => void;
  onDragStart: (id: string) => void;
  onDragEnd: () => void;
  onDropOnEvent: (draggedId: string, targetId: string) => void;
}) {
  const meta =
    EVENT_CATEGORY_META[event.category as EventCategory] ?? {
      label: event.category,
      emoji: "📌",
    };
  const [deleting, setDeleting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  async function remove() {
    setDeleting(true);
    await fetch(`/api/events/${event.id}`, { method: "DELETE" });
    onChange();
  }

  return (
    <li
      draggable={!editing && !event.isReadOnly}
      onDragStart={(e) => {
        if (event.isReadOnly) return;
        e.dataTransfer.setData("text/plain", event.id);
        e.dataTransfer.effectAllowed = "move";
        onDragStart(event.id);
      }}
      onDragEnd={onDragEnd}
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragOver(false);
        const draggedId = e.dataTransfer.getData("text/plain");
        if (draggedId && draggedId !== event.id) {
          onDropOnEvent(draggedId, event.id);
        }
      }}
      className={cn(
        "group rounded-lg border border-ink-100 bg-white transition-all duration-150",
        draggingId === event.id && "opacity-30",
        dragOver &&
          draggingId &&
          draggingId !== event.id &&
          "border-brand-400 bg-brand-50"
      )}
    >
      {editing ? (
        <EditEventForm
          event={event}
          mapBias={mapBias}
          onDone={() => {
            setEditing(false);
            onChange();
          }}
          onCancel={() => setEditing(false)}
        />
      ) : (
        <div className="flex items-start gap-2 px-3 py-2.5">
          {!event.isReadOnly && (
            <div className="mt-1 cursor-grab text-ink-200 opacity-0 transition group-hover:opacity-100 active:cursor-grabbing">
              <GripVertical size={14} />
            </div>
          )}

          {/* Time */}
          <div className="mt-0.5 flex w-12 shrink-0 flex-col items-center">
            {event.startTime ? (
              <span className="flex items-center gap-0.5 text-xs font-semibold text-ink-700">
                <Clock size={11} /> {event.startTime}
              </span>
            ) : (
              <span className="text-xs text-ink-300">—</span>
            )}
          </div>

          {/* Emoji */}
          <span className="text-lg leading-none">{meta.emoji}</span>

          {/* Content */}
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold text-ink-900">{event.title}</div>
            {event.locationName && (
              <div className="mt-0.5 flex items-center gap-1 text-xs text-ink-500">
                <MapPin size={11} /> {event.locationName}
              </div>
            )}
            {event.description && (
              <p className="mt-1 text-xs text-ink-500">{event.description}</p>
            )}
            {([ "ATTRACTION", "FOOD", "HOTEL", "ACTIVITY" ].includes(event.category) || event.locationName || (event.lat != null && event.lng != null)) && (
              <NavButtons
                className="mt-1.5"
                target={{
                  lat: event.lat,
                  lng: event.lng,
                  name: event.locationName || event.title,
                  address: event.address,
                  placeId: event.placeId,
                }}
              />
            )}
          </div>

          {/* Actions */}
          {!event.isReadOnly && (
            <div className="flex shrink-0 items-center gap-1 opacity-0 transition group-hover:opacity-100">
              <button
                onClick={() => setEditing(true)}
                className="rounded p-1 text-ink-300 hover:bg-brand-50 hover:text-brand-500"
              >
                <Pencil size={13} />
              </button>
              <button
                onClick={remove}
                disabled={deleting}
                className="rounded p-1 text-ink-300 hover:bg-rose-50 hover:text-rose-500 disabled:opacity-50"
              >
                {deleting ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <Trash2 size={13} />
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </li>
  );
}

// ─── Location search shared hook ─────────────────────────────────────────────

function useLocationSearch(mapBias: { lat?: number; lng?: number }) {
  const [locationQuery, setLocationQuery] = useState("");
  const [place, setPlace] = useState<PlaceResult | null>(null);
  const [locationResults, setLocationResults] = useState<PlaceResult[]>([]);
  const [searchingLocation, setSearchingLocation] = useState(false);
  const [searchDone, setSearchDone] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (place) return;
    if (!locationQuery.trim() || locationQuery.trim().length < 2) {
      setLocationResults([]);
      setSearchDone(false);
      setSearchError(null);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setSearchDone(false);
    setSearchError(null);
    debounceRef.current = setTimeout(async () => {
      setSearchingLocation(true);
      const params = new URLSearchParams({ q: locationQuery });
      if (mapBias.lat && mapBias.lng) {
        params.set("lat", String(mapBias.lat));
        params.set("lng", String(mapBias.lng));
      }
      try {
        const res = await fetch(`/api/places/search?${params.toString()}`);
        const data = await res.json();
        if (!res.ok) {
          setSearchError(data?.error ?? "שגיאה בחיפוש");
          setLocationResults([]);
        } else {
          setLocationResults(Array.isArray(data) ? data : []);
          setSearchError(null);
        }
      } catch {
        setSearchError("לא ניתן לגשת לשירות החיפוש");
        setLocationResults([]);
      }
      setSearchingLocation(false);
      setSearchDone(true);
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [locationQuery, place, mapBias.lat, mapBias.lng]);

  function pickPlace(p: PlaceResult) {
    setPlace(p);
    setLocationQuery("");
    setLocationResults([]);
    setSearchDone(false);
    setSearchError(null);
  }

  function clearPlace() {
    setPlace(null);
    setLocationQuery("");
    setLocationResults([]);
    setSearchDone(false);
    setSearchError(null);
  }

  return {
    locationQuery,
    setLocationQuery: (q: string) => {
      setLocationQuery(q);
      setLocationResults([]);
      setSearchDone(false);
      setSearchError(null);
    },
    place,
    setPlace,
    locationResults,
    searchingLocation,
    searchDone,
    searchError,
    pickPlace,
    clearPlace,
  };
}

// ─── Shared location field UI ─────────────────────────────────────────────────

function LocationField({
  locationQuery,
  setLocationQuery,
  place,
  clearPlace,
  locationResults,
  searchingLocation,
  searchDone,
  searchError,
  pickPlace,
}: ReturnType<typeof useLocationSearch>) {
  return (
    <div className="relative">
      {place ? (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-300">
          <MapPin size={11} /> {place.name}
          <button
            onClick={clearPlace}
            className="ms-1 text-emerald-500 hover:text-emerald-700"
          >
            <X size={11} />
          </button>
        </span>
      ) : (
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
            {searchingLocation ? (
              <Loader2 size={13} className="animate-spin text-ink-400" />
            ) : (
              <MapPin size={13} className="text-ink-400" />
            )}
          </span>
          <Input
            placeholder="חפש מיקום ב-Google Maps (אופציונלי)"
            value={locationQuery}
            onChange={(e) => setLocationQuery(e.target.value)}
            className="pl-9"
          />
          {locationResults.length > 0 && (
            <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-52 overflow-y-auto rounded-lg border border-ink-200 bg-white shadow-lg thin-scroll">
              {locationResults.map((r) => (
                <button
                  key={r.placeId}
                  onClick={() => pickPlace(r)}
                  className="flex w-full items-start gap-2 px-3 py-2 text-right hover:bg-brand-50"
                >
                  <MapPin size={13} className="mt-0.5 shrink-0 text-brand-500" />
                  <div>
                    <div className="text-sm font-medium text-ink-800">{r.name}</div>
                    {r.address && (
                      <div className="text-xs text-ink-400">{r.address}</div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
          {searchDone && !searchingLocation && locationQuery.trim().length >= 2 && (
            searchError ? (
              <p className="mt-1 text-xs text-rose-500">
                שגיאת חיפוש: {searchError}
              </p>
            ) : locationResults.length === 0 ? (
              <p className="mt-1 text-xs text-ink-400">
                לא נמצאו תוצאות עבור &ldquo;{locationQuery}&rdquo;
              </p>
            ) : null
          )}
        </div>
      )}
    </div>
  );
}

// ─── EditEventForm ────────────────────────────────────────────────────────────

function EditEventForm({
  event,
  mapBias,
  onDone,
  onCancel,
}: {
  event: EventDTO;
  mapBias: { lat?: number; lng?: number };
  onDone: () => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(event.title);
  const [startTime, setStartTime] = useState(event.startTime ?? "");
  const [category, setCategory] = useState<EventCategory>(
    (event.category as EventCategory) ?? "SIGHTSEEING"
  );
  const [saving, setSaving] = useState(false);

  const locationSearch = useLocationSearch(mapBias);

  // Pre-fill location from existing event data
  useEffect(() => {
    if (event.locationName) {
      locationSearch.setPlace({
        placeId: event.placeId ?? "",
        name: event.locationName,
        address: event.address ?? undefined,
        lat: event.lat ?? undefined,
        lng: event.lng ?? undefined,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function save() {
    if (!title.trim()) return;
    setSaving(true);
    await fetch(`/api/events/${event.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        startTime: startTime || null,
        category,
        locationName: locationSearch.place?.name ?? null,
        address: locationSearch.place?.address ?? null,
        lat: locationSearch.place?.lat ?? null,
        lng: locationSearch.place?.lng ?? null,
        placeId: locationSearch.place?.placeId ?? null,
      }),
    });
    onDone();
  }

  return (
    <div className="space-y-2 p-3">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto_auto]">
        <Input
          placeholder="שם האירוע"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          autoFocus
        />
        <select
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
          className="w-28 rounded-lg border border-ink-200 bg-white px-2 py-2 text-sm text-ink-700"
        >
          <option value="">⏰ שעה</option>
          {TIME_OPTIONS.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as EventCategory)}
          className="rounded-lg border border-ink-200 bg-white px-2 py-2 text-sm"
        >
          {EVENT_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {EVENT_CATEGORY_META[c].emoji} {EVENT_CATEGORY_META[c].label}
            </option>
          ))}
        </select>
      </div>

      <LocationField {...locationSearch} />

      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={onCancel}>
          ביטול
        </Button>
        <Button
          size="sm"
          onClick={save}
          disabled={saving || !title.trim()}
        >
          {saving && <Loader2 size={14} className="animate-spin" />} שמור
        </Button>
      </div>
    </div>
  );
}

// ─── AddEventForm ─────────────────────────────────────────────────────────────

function AddEventForm({
  tripId,
  dayId,
  mapBias,
  onDone,
  onCancel,
}: {
  tripId: string;
  dayId: string;
  mapBias: { lat?: number; lng?: number };
  onDone: () => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState("");
  const [startTime, setStartTime] = useState("");
  const [category, setCategory] = useState<EventCategory>("SIGHTSEEING");
  const [saving, setSaving] = useState(false);

  const locationSearch = useLocationSearch(mapBias);

  async function save() {
    if (!title.trim()) return;
    setSaving(true);
    await fetch(`/api/trips/${tripId}/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        dayId,
        title,
        startTime: startTime || null,
        category,
        locationName: locationSearch.place?.name ?? null,
        address: locationSearch.place?.address ?? null,
        lat: locationSearch.place?.lat ?? null,
        lng: locationSearch.place?.lng ?? null,
        placeId: locationSearch.place?.placeId ?? null,
      }),
    });
    onDone();
  }

  return (
    <div className="mt-3 space-y-2 rounded-lg border border-brand-200 bg-brand-50/40 p-3">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto_auto]">
        <Input
          placeholder="שם האירוע (לדוג׳ ארוחת בוקר, מוזיאון, הליכה)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          autoFocus
        />
        <select
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
          className="w-28 rounded-lg border border-ink-200 bg-white px-2 py-2 text-sm text-ink-700"
        >
          <option value="">⏰ שעה</option>
          {TIME_OPTIONS.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as EventCategory)}
          className="rounded-lg border border-ink-200 bg-white px-2 py-2 text-sm"
        >
          {EVENT_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {EVENT_CATEGORY_META[c].emoji} {EVENT_CATEGORY_META[c].label}
            </option>
          ))}
        </select>
      </div>

      <LocationField {...locationSearch} />

      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={onCancel}>
          ביטול
        </Button>
        <Button size="sm" onClick={save} disabled={saving || !title.trim()}>
          {saving && <Loader2 size={14} className="animate-spin" />} הוסף ליום
        </Button>
      </div>
    </div>
  );
}

// ─── PlaceSearch (exported for other components) ──────────────────────────────

export function PlaceSearch({
  bias,
  onPick,
  onClose,
}: {
  bias?: { lat?: number; lng?: number };
  onPick: (p: PlaceResult) => void;
  onClose: () => void;
}) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [loading, setLoading] = useState(false);

  async function run() {
    if (!q.trim()) return;
    setLoading(true);
    const params = new URLSearchParams({ q });
    if (bias?.lat && bias?.lng) {
      params.set("lat", String(bias.lat));
      params.set("lng", String(bias.lng));
    }
    const res = await fetch(`/api/places/search?${params.toString()}`);
    const data = await res.json();
    setResults(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  return (
    <div className="mt-2 rounded-lg border border-ink-200 bg-white p-2">
      <div className="flex gap-2">
        <Input
          placeholder="חפש ב-Google Places (לדוג׳ סנסו-ג׳י, טוקיו)"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && run()}
        />
        <Button size="sm" onClick={run} type="button">
          {loading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
        </Button>
        <Button size="sm" variant="ghost" onClick={onClose} type="button">
          <X size={14} />
        </Button>
      </div>
      {results.length > 0 && (
        <ul className="mt-2 max-h-48 space-y-1 overflow-y-auto thin-scroll">
          {results.map((r) => (
            <li key={r.placeId}>
              <button
                onClick={() => onPick(r)}
                className="w-full rounded-md px-2 py-1.5 text-right text-sm hover:bg-brand-50"
              >
                <div className="font-medium text-ink-800">{r.name}</div>
                {r.address && <div className="text-xs text-ink-400">{r.address}</div>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
