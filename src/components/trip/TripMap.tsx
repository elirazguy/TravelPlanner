"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { GoogleMap, useLoadScript, MarkerF, InfoWindowF, PolylineF } from "@react-google-maps/api";
import { MapPin, Layers, Hotel as HotelIcon, Sparkles, Plus, Loader2, Check, Star, Flag, FlagTriangleRight } from "lucide-react";
import { Card, EmptyState, Button } from "@/components/ui";
import { sortEventsChronologically, formatDate } from "@/lib/utils";
import type { TripDTO, DayDTO } from "@/lib/types";

interface MapPoint {
  id: string;
  name: string;
  lat: number;
  lng: number;
  dayNumber?: number | null;
  color: string;
  time?: string | null;
  category?: string | null;
  address?: string | null;
  placeId?: string | null;
  kind: "event" | "place" | "unscheduled";
  isScheduled: boolean;
  rawSavedPlaceId?: string;
}

interface HotelPoint {
  id: string;
  name: string;
  lat: number;
  lng: number;
  checkInDate?: string | null;
  checkOutDate?: string | null;
  order?: number;
}

// Calculate Haversine distance in kilometers between two lat/lng points
function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function TripMap({ trip }: { trip: TripDTO }) {
  const router = useRouter();

  // Calculate points on the map: scheduled events, scheduled places, and unscheduled saved places
  const { points, scheduledCount, unscheduledCount } = useMemo(() => {
    const pts: MapPoint[] = [];
    const scheduledPlaceIds = new Set<string>();

    // 1. Add scheduled day events
    for (const day of trip.days) {
      for (const e of sortEventsChronologically(day.events)) {
        if (e.lat != null && e.lng != null) {
          pts.push({
            id: e.id,
            name: e.title,
            lat: e.lat,
            lng: e.lng,
            dayNumber: day.dayNumber,
            color: day.colorHex,
            time: e.startTime,
            address: e.address,
            kind: "event",
            isScheduled: true,
          });
          if (e.placeId) scheduledPlaceIds.add(e.placeId);
        }
      }
      for (const p of day.savedPlaces) {
        if (p.lat != null && p.lng != null) {
          pts.push({
            id: p.id,
            name: p.name,
            lat: p.lat,
            lng: p.lng,
            dayNumber: day.dayNumber,
            color: day.colorHex,
            category: p.category,
            address: p.address,
            kind: "place",
            isScheduled: true,
            rawSavedPlaceId: p.id,
          });
          scheduledPlaceIds.add(p.id);
        }
      }
    }

    // 2. Add unscheduled saved places (places not yet assigned to any day)
    let unschedCount = 0;
    for (const p of trip.savedPlaces) {
      if (p.lat != null && p.lng != null && !p.assignedDayId && !scheduledPlaceIds.has(p.id)) {
        pts.push({
          id: `unsched-${p.id}`,
          name: p.name,
          lat: p.lat,
          lng: p.lng,
          dayNumber: null,
          color: "#f59e0b", // Gold / Amber marker for unscheduled candidates
          category: p.category,
          address: p.address,
          placeId: p.placeId,
          kind: "unscheduled",
          isScheduled: false,
          rawSavedPlaceId: p.id,
        });
        unschedCount++;
      }
    }

    return {
      points: pts,
      scheduledCount: pts.length - unschedCount,
      unscheduledCount: unschedCount,
    };
  }, [trip]);

  const hotels = useMemo<HotelPoint[]>(() => {
    return trip.hotels
      .filter((h) => h.lat != null && h.lng != null)
      .sort((a, b) => {
        if (!a.checkInDate) return 1;
        if (!b.checkInDate) return -1;
        return new Date(a.checkInDate).getTime() - new Date(b.checkInDate).getTime();
      })
      .map((h, i) => ({
        id: h.id,
        name: h.name,
        lat: h.lat!,
        lng: h.lng!,
        checkInDate: h.checkInDate,
        checkOutDate: h.checkOutDate,
        order: i + 1,
      }));
  }, [trip]);

  const center = useMemo(() => {
    if (trip.mapCenterLat && trip.mapCenterLng) return { lat: trip.mapCenterLat, lng: trip.mapCenterLng };
    if (points.length) return { lat: points[0].lat, lng: points[0].lng };
    if (hotels.length) return { lat: hotels[0].lat, lng: hotels[0].lng };
    return { lat: 20, lng: 0 };
  }, [trip, points, hotels]);

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_260px]">
      <Card className="overflow-hidden">
        <div className="h-[560px] w-full">
          {apiKey ? (
            <GoogleMapView
              apiKey={apiKey}
              center={center}
              points={points}
              hotels={hotels}
              days={trip.days}
              tripId={trip.id}
            />
          ) : (
            <MapFallback points={points} hotels={hotels} />
          )}
        </div>
      </Card>

      {/* Legend & Stats */}
      <div className="space-y-3">
        <Card className="h-fit p-4">
          <h3 className="mb-3 flex items-center gap-1.5 text-sm font-bold text-ink-900">
            <Layers size={15} /> מקרא ימים ומקומות
          </h3>
          <ul className="space-y-2">
            {trip.days.map((d) => {
              const count = points.filter((p) => p.isScheduled && p.dayNumber === d.dayNumber).length;
              return (
                <li key={d.id} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <span className="h-3.5 w-3.5 rounded-full shadow-sm" style={{ backgroundColor: d.colorHex }} />
                    <span className="font-medium text-ink-800">יום {d.dayNumber}</span>
                  </span>
                  <span className="text-xs font-semibold text-ink-500">{count} סיכות</span>
                </li>
              );
            })}

            {unscheduledCount > 0 && (
              <li className="mt-3 flex items-center justify-between border-t border-ink-100 pt-2 text-sm">
                <span className="flex items-center gap-2">
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[10px] text-white font-bold">
                    ★
                  </span>
                  <span className="font-semibold text-amber-700">שמורים (ממתינים)</span>
                </span>
                <span className="text-xs font-bold text-amber-600">{unscheduledCount} מועמדים</span>
              </li>
            )}
          </ul>
        </Card>

        {hotels.length > 0 && (
          <Card className="h-fit p-4">
            <h3 className="mb-3 flex items-center gap-1.5 text-sm font-bold text-ink-900">
              <HotelIcon size={15} /> מלונות
            </h3>
            <ul className="space-y-2">
              {hotels.map((h) => (
                <li key={h.id} className="text-sm">
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded bg-violet-600 text-[11px] font-bold text-white">{h.order || "מ"}</span>
                    <span className="font-medium text-ink-800 truncate">{h.name}</span>
                  </div>
                  {h.checkInDate && (
                    <div className="mt-0.5 text-xs text-ink-400 mr-7">
                      {formatDate(h.checkInDate)} → {h.checkOutDate ? formatDate(h.checkOutDate) : "?"}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </Card>
        )}

        <div className="rounded-xl border border-amber-200/60 bg-amber-50/50 p-3 text-[11px] leading-relaxed text-amber-800">
          💡 <strong>טיפ חכם:</strong> לחץ על סיכה זהובה (★) במפה לקבלת המלצה חכמה לשיבוץ לפי המרחק מפעילויות היום, ושיבוץ בלחיצה אחת.
        </div>
      </div>
    </div>
  );
}

const MAP_LIBRARIES: "places"[] = ["places"];

function renderNavLinks(lat: number, lng: number) {
  return (
    <div className="mt-3 flex items-center gap-2 border-t border-ink-100 pt-2.5">
      <a
        href={`https://waze.com/ul?ll=${lat},${lng}&navigate=yes`}
        target="_blank"
        rel="noreferrer"
        className="flex-1 flex items-center justify-center rounded bg-blue-50 py-1.5 text-[11px] font-bold text-blue-700 hover:bg-blue-100 transition-colors"
      >
        Waze
      </a>
      <a
        href={`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`}
        target="_blank"
        rel="noreferrer"
        className="flex-1 flex items-center justify-center rounded bg-emerald-50 py-1.5 text-[11px] font-bold text-emerald-700 hover:bg-emerald-100 transition-colors"
      >
        Google Maps
      </a>
    </div>
  );
}

function GoogleMapView({
  apiKey,
  center,
  points,
  hotels,
  days,
  tripId,
}: {
  apiKey: string;
  center: { lat: number; lng: number };
  points: MapPoint[];
  hotels: HotelPoint[];
  days: DayDTO[];
  tripId: string;
}) {
  const router = useRouter();
  const { isLoaded } = useLoadScript({ googleMapsApiKey: apiKey, libraries: MAP_LIBRARIES });
  const [activePoint, setActivePoint] = useState<MapPoint | null>(null);
  const [activeHotel, setActiveHotel] = useState<HotelPoint | null>(null);
  const [assigning, setAssigning] = useState<string | null>(null);

  const dayLines = useMemo(() => {
    const lines: { dayId: string; color: string; path: { lat: number; lng: number }[], firstPointId: string | null, lastPointId: string | null }[] = [];
    for (const d of days) {
      const dayPoints = points.filter((p) => p.isScheduled && p.dayNumber === d.dayNumber);
      if (dayPoints.length > 0) {
        lines.push({
          dayId: d.id,
          color: d.colorHex,
          path: dayPoints.length > 1 ? dayPoints.map((p) => ({ lat: p.lat, lng: p.lng })) : [],
          firstPointId: dayPoints[0].id,
          lastPointId: dayPoints.length > 1 ? dayPoints[dayPoints.length - 1].id : null,
        });
      }
    }
    return lines;
  }, [points, days]);

  const firstPointIds = useMemo(() => new Set(dayLines.map(l => l.firstPointId).filter(Boolean)), [dayLines]);
  const lastPointIds = useMemo(() => new Set(dayLines.map(l => l.lastPointId).filter(Boolean)), [dayLines]);

  if (!isLoaded) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-ink-400">
        טוען מפה...
      </div>
    );
  }

  const totalMarkers = points.length + hotels.length;

  // Compute smart recommended day for an unscheduled point
  function getRecommendation(p: MapPoint) {
    if (p.isScheduled || !days.length) return null;

    let bestDay: DayDTO | null = null;
    let minDistance = Infinity;

    for (const d of days) {
      const dayPoints = d.events.filter((e) => e.lat != null && e.lng != null);
      if (dayPoints.length === 0) continue;

      const avgLat = dayPoints.reduce((acc, pt) => acc + pt.lat!, 0) / dayPoints.length;
      const avgLng = dayPoints.reduce((acc, pt) => acc + pt.lng!, 0) / dayPoints.length;
      const dist = haversineKm(p.lat, p.lng, avgLat, avgLng);

      if (dist < minDistance) {
        minDistance = dist;
        bestDay = d;
      }
    }

    if (!bestDay) return { bestDay: days[0], distanceKm: null };
    return { bestDay, distanceKm: Math.round(minDistance * 10) / 10 };
  }

  async function handleAssignToDay(point: MapPoint, targetDay: DayDTO) {
    if (!point.rawSavedPlaceId) return;
    setAssigning(targetDay.id);

    try {
      // 1. Assign saved place to day
      await fetch(`/api/places/${point.rawSavedPlaceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignedDayId: targetDay.id }),
      });

      // 2. Add event to itinerary day
      await fetch(`/api/trips/${tripId}/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dayId: targetDay.id,
          title: point.name,
          address: point.address || null,
          lat: point.lat,
          lng: point.lng,
          placeId: point.placeId || null,
          category: point.category || "ACTIVITY",
        }),
      });

      setActivePoint(null);
      router.refresh();
    } catch (err) {
      console.error("Failed to assign place:", err);
    } finally {
      setAssigning(null);
    }
  }

  return (
    <GoogleMap
      mapContainerStyle={{ width: "100%", height: "100%" }}
      center={center}
      zoom={totalMarkers ? 12 : 3}
      options={{ streetViewControl: false, mapTypeControl: false }}
    >
      {/* Polylines for days */}
      {dayLines.filter(l => l.path.length > 1).map((line) => (
        <PolylineF
          key={`poly-${line.dayId}`}
          path={line.path}
          options={{
            strokeColor: line.color,
            strokeOpacity: 0, // 0 for dashed, as icons provide the visible dash
            strokeWeight: 2.5,
            icons: [
              {
                icon: {
                  path: "M 0,-1 0,1",
                  strokeOpacity: 1,
                  scale: 2.5,
                },
                offset: "0",
                repeat: "12px",
              },
            ],
          }}
        />
      ))}

      {/* Markers */}
      {points.map((p) => {
        let labelText = "★";
        if (p.isScheduled) {
          const isFirst = firstPointIds.has(p.id);
          const isLast = lastPointIds.has(p.id);
          labelText = `${isFirst ? "▶ " : ""}${p.dayNumber}${isLast ? " 🏁" : ""}`;
        }
        
        return (
          <MarkerF
            key={p.id}
            position={{ lat: p.lat, lng: p.lng }}
            onClick={() => {
              setActivePoint(p);
              setActiveHotel(null);
            }}
            label={{
              text: labelText,
              color: "#ffffff",
              fontSize: p.isScheduled ? (firstPointIds.has(p.id) || lastPointIds.has(p.id) ? "10px" : "11px") : "12px",
              fontWeight: "700",
            }}
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              scale: p.isScheduled ? (firstPointIds.has(p.id) || lastPointIds.has(p.id) ? 14 : 11) : 13,
              fillColor: p.color,
              fillOpacity: 1,
              strokeColor: "#ffffff",
              strokeWeight: p.isScheduled ? 2 : 2.5,
            }}
          />
        );
      })}

      {/* Hotel markers */}
      {hotels.map((h) => (
        <MarkerF
          key={h.id}
          position={{ lat: h.lat, lng: h.lng }}
          onClick={() => {
            setActiveHotel(h);
            setActivePoint(null);
          }}
          label={{ text: `🏨 ${h.order || ""}`, color: "#ffffff", fontSize: "12px", fontWeight: "700" }}
          icon={{
            path: google.maps.SymbolPath.CIRCLE,
            scale: 14,
            fillColor: "#7c3aed",
            fillOpacity: 1,
            strokeColor: "#ffffff",
            strokeWeight: 2.5,
          }}
        />
      ))}

      {/* InfoWindow for Events and Saved Places */}
      {activePoint && (
        <InfoWindowF position={{ lat: activePoint.lat, lng: activePoint.lng }} onCloseClick={() => setActivePoint(null)}>
          <div className="max-w-[240px] p-1 dir-rtl text-right">
            <div className="flex items-center gap-1.5">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: activePoint.color }}
              />
              <div className="text-sm font-bold text-ink-900 truncate">{activePoint.name}</div>
            </div>

            {activePoint.address && (
              <div className="mt-1 text-[11px] text-ink-500 leading-tight truncate">{activePoint.address}</div>
            )}

            {/* Scheduled item details */}
            {activePoint.isScheduled ? (
              <div className="mt-2 flex items-center justify-between rounded bg-ink-50 px-2 py-1 text-xs text-ink-700">
                <span className="font-semibold">יום {activePoint.dayNumber}</span>
                {activePoint.time && <span className="text-ink-500">{activePoint.time}</span>}
              </div>
            ) : (
              /* Unscheduled candidate place info & smart recommendation */
              <div className="mt-3 space-y-2.5 border-t border-ink-100 pt-2">
                {(() => {
                  const rec = getRecommendation(activePoint);
                  if (!rec || !rec.bestDay) return null;
                  return (
                    <div className="rounded-lg bg-amber-50 p-2 text-[11px] text-amber-900 border border-amber-200">
                      <div className="flex items-center gap-1 font-bold text-amber-700">
                        <Sparkles size={12} /> מומלץ ליום {rec.bestDay.dayNumber}
                      </div>
                      <div className="mt-0.5 text-amber-600">
                        {rec.distanceKm != null
                          ? `הכי קרוב לפעילויות היום (~${rec.distanceKm} ק"מ)`
                          : "מתאים לשיבוץ במסלול"}
                      </div>
                    </div>
                  );
                })()}

                <div>
                  <div className="mb-1.5 text-[11px] font-bold text-ink-700">שיבוץ מהיר ליום:</div>
                  <div className="flex flex-wrap gap-1">
                    {days.map((d) => {
                      const rec = getRecommendation(activePoint);
                      const isRecommended = rec?.bestDay?.id === d.id;
                      const isPending = assigning === d.id;

                      return (
                        <button
                          key={d.id}
                          onClick={() => handleAssignToDay(activePoint, d)}
                          disabled={assigning !== null}
                          className={`flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-bold transition-all ${
                            isRecommended
                              ? "bg-amber-500 text-white shadow-sm hover:bg-amber-600"
                              : "bg-ink-100 text-ink-700 hover:bg-brand-50 hover:text-brand-700"
                          }`}
                        >
                          {isPending ? (
                            <Loader2 size={10} className="animate-spin" />
                          ) : isRecommended ? (
                            <Star size={10} className="fill-white" />
                          ) : (
                            <Plus size={10} />
                          )}
                          יום {d.dayNumber}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
            {renderNavLinks(activePoint.lat, activePoint.lng)}
          </div>
        </InfoWindowF>
      )}

      {/* InfoWindow for Hotels */}
      {activeHotel && (
        <InfoWindowF position={{ lat: activeHotel.lat, lng: activeHotel.lng }} onCloseClick={() => setActiveHotel(null)}>
          <div className="p-1 dir-rtl text-right">
            <div className="flex items-center gap-1.5 text-sm font-bold text-violet-900">
              <HotelIcon size={14} className="text-violet-600" /> {activeHotel.name}
            </div>
            {activeHotel.checkInDate && (
              <div className="mt-1 text-xs text-ink-500">
                {formatDate(activeHotel.checkInDate)} → {activeHotel.checkOutDate ? formatDate(activeHotel.checkOutDate) : "?"}
              </div>
            )}
            {renderNavLinks(activeHotel.lat, activeHotel.lng)}
          </div>
        </InfoWindowF>
      )}
    </GoogleMap>
  );
}

function MapFallback({ points, hotels }: { points: MapPoint[]; hotels: HotelPoint[] }) {
  if (points.length === 0 && hotels.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <EmptyState
          icon={<MapPin size={36} />}
          title="עדיין אין מיקומים במפה"
          hint="צרף מיקומים לאירועי המסלול כדי לסמן אותם על המפה."
        />
      </div>
    );
  }
  return (
    <div className="h-full overflow-y-auto thin-scroll bg-ink-50/40 p-4">
      <ul className="space-y-2">
        {points.map((p) => (
          <li key={p.id} className="flex items-center gap-3 rounded-lg border border-ink-100 bg-white px-3 py-2">
            <span
              className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white"
              style={{ backgroundColor: p.color }}
            >
              {p.isScheduled ? p.dayNumber : "★"}
            </span>
            <div>
              <div className="text-sm font-medium text-ink-800">{p.name}</div>
              <div className="text-xs text-ink-400">
                {p.lat.toFixed(4)}, {p.lng.toFixed(4)}
              </div>
            </div>
          </li>
        ))}
        {hotels.map((h) => (
          <li key={h.id} className="flex items-center gap-3 rounded-lg border border-violet-100 bg-violet-50 px-3 py-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-violet-600 text-xs font-bold text-white">
              מ
            </span>
            <div>
              <div className="text-sm font-medium text-ink-800">{h.name}</div>
              <div className="text-xs text-ink-400">
                {h.lat.toFixed(4)}, {h.lng.toFixed(4)}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
