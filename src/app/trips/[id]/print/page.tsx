import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatDate, formatDateRange, sortEventsChronologically } from "@/lib/utils";
import { EVENT_CATEGORY_META } from "@/lib/constants";
import type { EventCategory } from "@/lib/constants";
import { PrintButton } from "./PrintButton";

export const dynamic = "force-dynamic";

const TRANSPORT_LABELS: Record<string, string> = {
  CAR_RENTAL: "השכרת רכב",
  BUS: "אוטובוס",
  TRAIN: "רכבת",
  SHUTTLE: "שאטל",
  TAXI: "מונית",
  PRIVATE_DRIVER: "נהג פרטי",
};

export default async function PrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const trip = await prisma.trip.findUnique({
    where: { id },
    include: {
      days: {
        orderBy: { dayNumber: "asc" },
        include: { events: { orderBy: { orderIndex: "asc" } } },
      },
      hotels: { orderBy: { checkInDate: "asc" } },
      flights: { orderBy: { flightDate: "asc" } },
      transportation: { orderBy: { date: "asc" } },
    },
  });

  if (!trip) notFound();

  return (
    <div className="min-h-screen bg-white p-8 font-sans text-ink-900 no-print-frame">
      {/* Print controls — hidden when printing */}
      <div className="no-print mb-8 flex items-center justify-between rounded-xl border border-ink-200 bg-ink-50 px-5 py-3">
        <span className="text-sm text-ink-600">
          תצוגת PDF — לחץ <strong>הדפס / שמור</strong> כדי לייצא לקובץ PDF
        </span>
        <PrintButton />
      </div>

      {/* Trip header */}
      <div className="border-b-2 border-brand-600 pb-4 mb-6">
        <h1 className="text-3xl font-extrabold text-ink-900">{trip.title}</h1>
        <div className="mt-1 flex flex-wrap gap-4 text-sm text-ink-600">
          <span>{trip.destination}{trip.country ? `, ${trip.country}` : ""}</span>
          <span>·</span>
          <span>{formatDateRange(trip.startDate, trip.endDate)}</span>
        </div>
        {trip.notes && <p className="mt-2 text-sm text-ink-500 italic">{trip.notes}</p>}
      </div>

      {/* Flights */}
      {trip.flights.length > 0 && (
        <section className="mb-8 print-section">
          <h2 className="mb-3 text-xl font-bold text-ink-900 border-b border-ink-200 pb-1">✈ טיסות</h2>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-ink-50">
                <th className="border border-ink-200 px-3 py-2 text-right font-semibold">מספר טיסה</th>
                <th className="border border-ink-200 px-3 py-2 text-right font-semibold">חברה</th>
                <th className="border border-ink-200 px-3 py-2 text-right font-semibold">מ</th>
                <th className="border border-ink-200 px-3 py-2 text-right font-semibold">ל</th>
                <th className="border border-ink-200 px-3 py-2 text-right font-semibold">תאריך</th>
              </tr>
            </thead>
            <tbody>
              {trip.flights.map((f) => (
                <tr key={f.id}>
                  <td className="border border-ink-200 px-3 py-2 font-mono font-bold">{f.flightNumber}</td>
                  <td className="border border-ink-200 px-3 py-2">{f.airline ?? "—"}</td>
                  <td className="border border-ink-200 px-3 py-2">{f.departureAirport ?? "—"}</td>
                  <td className="border border-ink-200 px-3 py-2">{f.arrivalAirport ?? "—"}</td>
                  <td className="border border-ink-200 px-3 py-2">{formatDate(f.flightDate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {/* Hotels */}
      {trip.hotels.length > 0 && (
        <section className="mb-8 print-section">
          <h2 className="mb-3 text-xl font-bold text-ink-900 border-b border-ink-200 pb-1">🏨 לינה</h2>
          <div className="space-y-3">
            {trip.hotels.map((h) => (
              <div key={h.id} className="rounded border border-ink-200 px-4 py-3">
                <div className="font-bold text-ink-900">{h.name}</div>
                {h.checkInDate && (
                  <div className="text-sm text-ink-600">
                    כניסה: {formatDate(h.checkInDate)} · יציאה: {h.checkOutDate ? formatDate(h.checkOutDate) : "?"}
                  </div>
                )}
                {h.address && <div className="text-sm text-ink-500">{h.address}</div>}
                {h.confirmationNumber && (
                  <div className="text-xs text-ink-400 mt-1">אישור: <span className="font-mono">{h.confirmationNumber}</span></div>
                )}
                {h.phone && <div className="text-xs text-ink-500">טלפון: {h.phone}</div>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Transportation */}
      {trip.transportation.length > 0 && (
        <section className="mb-8 print-section">
          <h2 className="mb-3 text-xl font-bold text-ink-900 border-b border-ink-200 pb-1">🚗 תחבורה</h2>
          <div className="space-y-2">
            {trip.transportation.map((t) => (
              <div key={t.id} className="rounded border border-ink-200 px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-ink-900">{TRANSPORT_LABELS[t.type] ?? t.type}</span>
                  {t.date && <span className="text-sm text-ink-500">{formatDate(t.date)}</span>}
                </div>
                {(t.fromLocation || t.toLocation) && (
                  <div className="mt-1 text-sm text-ink-700">
                    {t.fromLocation && <span>{t.fromLocation}</span>}
                    {t.fromLocation && t.toLocation && <span className="mx-1">→</span>}
                    {t.toLocation && <span>{t.toLocation}</span>}
                  </div>
                )}
                {(t.departureTime || t.arrivalTime) && (
                  <div className="text-xs text-ink-500">
                    {t.departureTime && <span>יציאה: {t.departureTime}</span>}
                    {t.departureTime && t.arrivalTime && <span> · </span>}
                    {t.arrivalTime && <span>הגעה: {t.arrivalTime}</span>}
                  </div>
                )}
                {t.company && <div className="text-xs text-ink-500">חברה: {t.company}</div>}
                {t.vehicle && <div className="text-xs text-ink-500">רכב: {t.vehicle}</div>}
                {t.reference && (
                  <div className="text-xs text-ink-400">אישור: <span className="font-mono">{t.reference}</span></div>
                )}
                {(t.contactName || t.contactPhone) && (
                  <div className="text-xs text-ink-500">
                    {t.contactName && <span>{t.contactName}</span>}
                    {t.contactName && t.contactPhone && <span> · </span>}
                    {t.contactPhone && <span>{t.contactPhone}</span>}
                  </div>
                )}
                {t.notes && <div className="text-xs text-ink-400 italic">{t.notes}</div>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Day-by-day itinerary */}
      <section className="print-section">
        <h2 className="mb-3 text-xl font-bold text-ink-900 border-b border-ink-200 pb-1">📅 מסלול יומי</h2>
        <div className="space-y-6">
          {trip.days.map((day) => {
            const events = sortEventsChronologically(day.events);
            return (
              <div key={day.id} className="print-day">
                <div className="flex items-center gap-3 mb-2">
                  <span
                    className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white"
                    style={{ backgroundColor: day.colorHex }}
                  >
                    {day.dayNumber}
                  </span>
                  <h3 className="font-bold text-ink-900">
                    יום {day.dayNumber} · {formatDate(day.date, { weekday: "long" })}
                  </h3>
                </div>
                {events.length === 0 ? (
                  <p className="text-sm text-ink-400 mr-10">אין אירועים מתוכננים</p>
                ) : (
                  <ul className="space-y-1.5 mr-10">
                    {events.map((e) => {
                      const meta = EVENT_CATEGORY_META[e.category as EventCategory] ?? { emoji: "📌", label: e.category };
                      return (
                        <li key={e.id} className="flex items-start gap-2 text-sm">
                          <span className="shrink-0 w-12 text-ink-400">{e.startTime ?? "—"}</span>
                          <span className="shrink-0">{meta.emoji}</span>
                          <div>
                            <span className="font-medium text-ink-800">{e.title}</span>
                            {e.locationName && <span className="text-ink-500 text-xs"> · {e.locationName}</span>}
                            {e.description && <p className="text-xs text-ink-400 mt-0.5">{e.description}</p>}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <div className="mt-8 border-t border-ink-200 pt-4 text-xs text-ink-400 text-center no-print">
        יוצא מאפליקציית TravelPlanner · {new Date().toLocaleDateString("he-IL")}
      </div>
    </div>
  );
}
