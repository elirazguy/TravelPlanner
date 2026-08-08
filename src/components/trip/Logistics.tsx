"use client";

import { useState, useEffect } from "react";

import { useRouter } from "next/navigation";
import {
  Hotel as HotelIcon,
  Plane,
  Phone,
  Globe,
  MapPin,
  Plus,
  Trash2,
  Loader2,
  RefreshCw,
  X,
  Search,
  Car,
  Bus,
  Train,
  Truck,
  User,
  ArrowRight,
} from "lucide-react";

import { Button, Card, Input, Label, Badge, EmptyState } from "@/components/ui";
import { NavButtons } from "@/components/NavButtons";
import { formatDate, cn } from "@/lib/utils";
import type { TripDTO, HotelDTO, FlightDTO, TransportationDTO } from "@/lib/types";
import type { LiveFlightStatus } from "@/lib/flights";
import type { PlaceResult } from "@/lib/places";

// ── Tab navigation ───────────────────────────────────────────────────────────
type LogisticsTab = "hotels" | "flights" | "transportation";

export function Logistics({ trip }: { trip: TripDTO }) {
  const [activeTab, setActiveTab] = useState<LogisticsTab>("hotels");

  return (
    <div>
      <div className="mb-6 flex gap-1 rounded-xl border border-ink-200 bg-ink-50 p-1">
        {(
          [
            { key: "hotels" as const, label: "לינה", icon: <HotelIcon size={15} /> },
            { key: "flights" as const, label: "טיסות", icon: <Plane size={15} /> },
            { key: "transportation" as const, label: "תחבורה", icon: <Car size={15} /> },
          ] as const
        ).map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
              activeTab === t.key ? "bg-white text-ink-900 shadow-sm" : "text-ink-500 hover:text-ink-700"
            )}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === "hotels" && <HotelsSection trip={trip} />}
      {activeTab === "flights" && <FlightsSection trip={trip} />}
      {activeTab === "transportation" && <TransportationSection trip={trip} />}
    </div>
  );
}

// ── Hotels ──────────────────────────────────────────────────────────────────
function HotelsSection({ trip }: { trip: TripDTO }) {
  const router = useRouter();

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-bold text-ink-900">
          <HotelIcon size={18} /> לינה
        </h2>
      </div>

      <div className="mb-4 rounded-xl border border-blue-100 bg-blue-50/80 p-3 text-xs text-blue-800 flex items-center gap-2 font-medium">
        <HotelIcon size={16} className="shrink-0 text-blue-600" />
        <span>נתוני הלינה נשאבים אוטומטית ממסמכי הטיול שאתה מעלה בדף "מסמכים" (תגית מלון).</span>
      </div>

      {trip.hotels.length === 0 && (
        <EmptyState
          icon={<HotelIcon size={32} />}
          title="לא נמצאו מלונות"
          hint='העלה אישורי מלון בדף "מסמכים" (תגית מלון) לקליטה אוטומטית.'
        />
      )}

      <div className="space-y-3">
        {trip.hotels.map((h) => (
          <HotelCard key={h.id} hotel={h} onChange={() => router.refresh()} />
        ))}
      </div>
      
    </div>
  );
}

function HotelCard({ hotel, onChange }: { hotel: HotelDTO; onChange: () => void }) {
  async function remove() {
    await fetch(`/api/hotels/${hotel.id}`, { method: "DELETE" });
    onChange();
  }
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-sm font-bold text-ink-900">{hotel.name}</h3>
          {hotel.checkInDate && (
            <div className="mt-1.5 inline-flex items-center gap-2 rounded-full border border-violet-200/70 bg-violet-50/90 px-3 py-1 text-xs font-semibold text-violet-900 shadow-2xs">
              <span dir="ltr" className="inline-flex items-center gap-1.5 tracking-tight font-sans">
                <span>{new Intl.DateTimeFormat("he-IL", { dateStyle: "short", timeStyle: "short", timeZone: "UTC" }).format(new Date(hotel.checkInDate))}</span>
                <ArrowRight size={13} className="shrink-0 text-violet-500 opacity-80" />
                <span>{hotel.checkOutDate ? new Intl.DateTimeFormat("he-IL", { dateStyle: "short", timeStyle: "short", timeZone: "UTC" }).format(new Date(hotel.checkOutDate)) : "?"}</span>
              </span>
            </div>
          )}
        </div>
        <button onClick={remove} className="rounded p-1 text-ink-300 hover:bg-rose-50 hover:text-rose-500">
          <Trash2 size={15} />
        </button>
      </div>
      <div className="mt-3 space-y-1.5 text-sm text-ink-600">
        {hotel.phone && (
          <div className="flex items-center gap-2">
            <Phone size={14} className="text-ink-400" />
            <a href={`tel:${hotel.phone}`} className="hover:text-brand-600" dir="ltr">{hotel.phone}</a>
          </div>
        )}
        {(hotel.address || (hotel.lat != null && hotel.lng != null)) && (
          <NavButtons
            className="pt-1"
            target={{ lat: hotel.lat, lng: hotel.lng, name: hotel.name, address: hotel.address }}
          />
        )}
      </div>
    </Card>
  );
}

interface HotelFormState {
  name: string;
  address: string;
  phone: string;
  website: string;
  confirmationNumber: string;
  checkInDate: string;
  checkOutDate: string;
  notes: string;
}

function HotelForm({
  tripId,
  prefilled,
  onDone,
  onCancel,
}: {
  tripId: string;
  prefilled?: Partial<HotelFormState> | null;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<HotelFormState>({
    name: prefilled?.name ?? "",
    address: prefilled?.address ?? "",
    phone: prefilled?.phone ?? "",
    website: prefilled?.website ?? "",
    confirmationNumber: prefilled?.confirmationNumber ?? "",
    checkInDate: prefilled?.checkInDate ?? "",
    checkOutDate: prefilled?.checkOutDate ?? "",
    notes: prefilled?.notes ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [placeResults, setPlaceResults] = useState<PlaceResult[]>([]);
  const [searchingPlace, setSearchingPlace] = useState(false);
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);

  const set = (k: keyof HotelFormState, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function searchHotelLocation() {
    if (!form.name) return;
    setSearchingPlace(true);
    const q = form.address ? `${form.name} ${form.address}` : form.name;
    const res = await fetch(`/api/places/search?q=${encodeURIComponent(q)}`);
    const data = await res.json();
    setPlaceResults(Array.isArray(data) ? data.slice(0, 3) : []);
    setSearchingPlace(false);
  }

  function pickPlace(p: PlaceResult) {
    if (!form.address && p.address) set("address", p.address);
    setLat(p.lat ?? null);
    setLng(p.lng ?? null);
    setPlaceResults([]);
  }

  async function save() {
    if (!form.name) return;
    setSaving(true);
    await fetch(`/api/trips/${tripId}/hotels`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, lat, lng }),
    });
    onDone();
  }

  return (
    <Card className="mt-3 space-y-3 p-4">
      {prefilled && (
        <div className="rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
          פרטים חולצו אוטומטית מהמסמך — בדוק ועדכן לפי הצורך
        </div>
      )}
      <div>
        <Label>שם המלון</Label>
        <Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Hotel name" />
      </div>
      <div>
        <Label>כתובת</Label>
        <div className="flex gap-2">
          <Input value={form.address} onChange={(e) => set("address", e.target.value)} placeholder="כתובת מלאה" className="flex-1" />
          <Button size="sm" variant="secondary" type="button" onClick={searchHotelLocation} disabled={searchingPlace || !form.name}>
            {searchingPlace ? <Loader2 size={13} className="animate-spin" /> : <Search size={13} />}
          </Button>
        </div>
        {placeResults.length > 0 && (
          <div className="mt-1 rounded-lg border border-ink-200 bg-white shadow">
            {placeResults.map((p) => (
              <button key={p.placeId} onClick={() => pickPlace(p)} className="flex w-full items-start gap-2 px-3 py-2 text-right text-sm hover:bg-brand-50">
                <MapPin size={12} className="mt-0.5 shrink-0 text-brand-500" />
                <div>
                  <div className="font-medium text-ink-800">{p.name}</div>
                  {p.address && <div className="text-xs text-ink-400">{p.address}</div>}
                </div>
              </button>
            ))}
          </div>
        )}
        {lat && <p className="mt-1 text-xs text-emerald-600">📍 מיקום על המפה נקבע</p>}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label>טלפון</Label>
          <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} />
        </div>
        <div>
          <Label>אתר אינטרנט</Label>
          <Input value={form.website} onChange={(e) => set("website", e.target.value)} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label>כניסה</Label>
          <Input type="date" value={form.checkInDate} onChange={(e) => set("checkInDate", e.target.value)} />
        </div>
        <div>
          <Label>יציאה</Label>
          <Input type="date" value={form.checkOutDate} onChange={(e) => set("checkOutDate", e.target.value)} />
        </div>
      </div>
      <div>
        <Label>מספר אישור</Label>
        <Input value={form.confirmationNumber} onChange={(e) => set("confirmationNumber", e.target.value)} />
      </div>
      {form.notes && (
        <div>
          <Label>הערות</Label>
          <Input value={form.notes} onChange={(e) => set("notes", e.target.value)} />
        </div>
      )}
      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={onCancel}>ביטול</Button>
        <Button size="sm" onClick={save} disabled={saving || !form.name}>
          {saving && <Loader2 size={14} className="animate-spin" />} שמור מלון
        </Button>
      </div>
    </Card>
  );
}

// ── Flights ─────────────────────────────────────────────────────────────────
function FlightsSection({ trip }: { trip: TripDTO }) {
  const router = useRouter();

  // Deduplicate flights by normalized flight number and date
  const uniqueFlights = trip.flights.filter((f, index, self) => {
    const cleanNum = (f.flightNumber || "").toUpperCase().replace(/\s+/g, "");
    const dateStr = f.flightDate ? new Date(f.flightDate).toISOString().split("T")[0] : "";
    const key = `${cleanNum}_${dateStr}`;
    return (
      self.findIndex((other) => {
        const otherNum = (other.flightNumber || "").toUpperCase().replace(/\s+/g, "");
        const otherDateStr = other.flightDate
          ? new Date(other.flightDate).toISOString().split("T")[0]
          : "";
        return `${otherNum}_${otherDateStr}` === key;
      }) === index
    );
  });

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-bold text-ink-900">
          <Plane size={18} /> טיסות
        </h2>
      </div>

      <div className="mb-4 rounded-xl border border-emerald-100 bg-emerald-50/80 p-3 text-xs text-emerald-800 flex items-center gap-2 font-medium">
        <span className="relative flex h-2 w-2 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <span>ניטור טיסות אוטומטי פעיל: המערכת מעדכנת אוטומטית את סטטוס הטיסה בזמן אמת מדי 5 דקות.</span>
      </div>

      {uniqueFlights.length === 0 && (
        <EmptyState
          icon={<Plane size={32} />}
          title="לא נמצאו טיסות"
          hint='העלה כרטיסי טיסה בדף "מסמכים" (תגית טיסה) לקליטה וניטור אוטומטי.'
        />
      )}

      <div className="space-y-3">
        {uniqueFlights.map((f) => (
          <FlightCard key={f.id} flight={f} onChange={() => router.refresh()} />
        ))}
      </div>
    </div>
  );
}

function FlightCard({ flight, onChange }: { flight: FlightDTO; onChange: () => void }) {
  const [status, setStatus] = useState<LiveFlightStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchStatus() {
    try {
      const res = await fetch(`/api/flights/${flight.id}/status`);
      if (res.ok) {
        setStatus(await res.json());
        setError(null);
      } else {
        setError("לא ניתן לאחזר סטטוס חי.");
      }
    } catch {
      setError("שגיאה בתקשורת עם שרת הטיסות.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchStatus();
    // Auto-refresh flight status every 5 minutes (300,000ms)
    const interval = setInterval(() => {
      fetchStatus();
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [flight.id]);

  async function remove() {
    await fetch(`/api/flights/${flight.id}`, { method: "DELETE" });
    onChange();
  }

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-mono text-sm font-bold text-ink-900">{flight.flightNumber}</h3>
            {flight.airline && <span className="text-xs text-ink-500">{flight.airline}</span>}
          </div>
          <div className="mt-1 text-xs text-ink-500">
            {flight.departureAirport ?? "—"} → {flight.arrivalAirport ?? "—"} · {formatDate(flight.flightDate)}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {loading && !status ? (
            <span className="flex items-center gap-1.5 text-xs text-ink-400">
              <Loader2 size={13} className="animate-spin text-blue-500" />
              בודק סטטוס...
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 rounded-full shadow-xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              מעקב אוטומטי בזמן אמת
            </span>
          )}
          <button
            onClick={remove}
            className="rounded p-1.5 text-ink-300 hover:bg-rose-50 hover:text-rose-500 transition-colors"
            title="מחק טיסה"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>
      {error && <p className="mt-2 text-xs text-rose-500">{error}</p>}
      {status && <LiveStatus status={status} />}
    </Card>
  );
}

const FLIGHT_STATUS_LABEL: Record<string, string> = {
  scheduled: "מתוכנן",
  active: "פעיל",
  landed: "נחת",
  cancelled: "בוטל",
  diverted: "הוסט",
};

function LiveStatus({ status }: { status: LiveFlightStatus }) {
  const statusColor: Record<string, string> = {
    scheduled: "bg-sky-100 text-sky-700 ring-sky-600/20",
    active: "bg-emerald-100 text-emerald-700 ring-emerald-600/20",
    landed: "bg-ink-100 text-ink-600 ring-ink-500/20",
    cancelled: "bg-rose-100 text-rose-700 ring-rose-600/20",
    diverted: "bg-amber-100 text-amber-700 ring-amber-600/20",
  };
  const fmtTime = (t?: string | null) =>
    t ? new Date(t).toLocaleString("he-IL", { hour: "2-digit", minute: "2-digit", month: "short", day: "numeric" }) : "—";

  return (
    <div className="mt-3 rounded-lg border border-ink-100 bg-ink-50/60 p-3">
      <div className="mb-2 flex items-center justify-between">
        <Badge className={statusColor[status.status ?? ""] ?? "bg-ink-100 text-ink-600 ring-ink-500/20"}>
          {FLIGHT_STATUS_LABEL[status.status ?? ""] ?? "לא ידוע"}
        </Badge>
        {status.source === "mock" && (
          <span className="text-[10px] uppercase tracking-wide text-amber-600">
            נתוני דמו — הגדר AVIATIONSTACK_API_KEY
          </span>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3 text-xs">
        <Segment label="המראה" seg={status.departure} fmtTime={fmtTime} />
        <Segment label="נחיתה" seg={status.arrival} fmtTime={fmtTime} />
      </div>
    </div>
  );
}

function Segment({ label, seg, fmtTime }: { label: string; seg: LiveFlightStatus["departure"]; fmtTime: (t?: string | null) => string }) {
  const delayed = (seg.delayMinutes ?? 0) > 0;
  return (
    <div>
      <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-ink-400">{label}</div>
      <div className="font-semibold text-ink-800">{seg.iata ?? seg.airport ?? "—"}</div>
      <div className="text-ink-600">מתוכנן: {fmtTime(seg.scheduled)}</div>
      <div className={cn(delayed ? "text-rose-600" : "text-ink-600")}>
        משוער: {fmtTime(seg.estimated)}
        {delayed && ` (+${seg.delayMinutes}m)`}
      </div>
      <div className="mt-1 text-ink-500">
        {seg.terminal && <span>טרמינל {seg.terminal}</span>}
        {seg.gate && <span> · שער {seg.gate}</span>}
      </div>
    </div>
  );
}

function FlightForm({ tripId, onDone, onCancel }: { tripId: string; onDone: () => void; onCancel: () => void }) {
  const [form, setForm] = useState({ flightNumber: "", airline: "", departureAirport: "", arrivalAirport: "", flightDate: "" });
  const [saving, setSaving] = useState(false);
  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function save() {
    if (!form.flightNumber) return;
    setSaving(true);
    await fetch(`/api/trips/${tripId}/flights`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    onDone();
  }

  return (
    <Card className="mt-3 space-y-3 p-4">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label>מספר טיסה</Label>
          <Input placeholder="BA245" value={form.flightNumber} onChange={(e) => set("flightNumber", e.target.value)} />
        </div>
        <div>
          <Label>חברת תעופה</Label>
          <Input value={form.airline} onChange={(e) => set("airline", e.target.value)} />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div>
          <Label>מ (IATA)</Label>
          <Input placeholder="TLV" value={form.departureAirport} onChange={(e) => set("departureAirport", e.target.value)} />
        </div>
        <div>
          <Label>ל (IATA)</Label>
          <Input placeholder="HND" value={form.arrivalAirport} onChange={(e) => set("arrivalAirport", e.target.value)} />
        </div>
        <div>
          <Label>תאריך</Label>
          <Input type="date" value={form.flightDate} onChange={(e) => set("flightDate", e.target.value)} />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={onCancel}><X size={14} /> ביטול</Button>
        <Button size="sm" onClick={save} disabled={saving || !form.flightNumber}>
          {saving && <Loader2 size={14} className="animate-spin" />} הוסף טיסה
        </Button>
      </div>
    </Card>
  );
}

// ── Transportation ──────────────────────────────────────────────────────────

const TRANSPORT_META: Record<string, { label: string; icon: React.ReactNode; badge: string }> = {
  CAR_RENTAL:     { label: "השכרת רכב",  icon: <Car size={14} />,   badge: "bg-blue-100 text-blue-700 ring-blue-600/20" },
  BUS:            { label: "אוטובוס",    icon: <Bus size={14} />,   badge: "bg-emerald-100 text-emerald-700 ring-emerald-600/20" },
  TRAIN:          { label: "רכבת",       icon: <Train size={14} />, badge: "bg-orange-100 text-orange-700 ring-orange-600/20" },
  SHUTTLE:        { label: "שאטל",       icon: <Truck size={14} />, badge: "bg-violet-100 text-violet-700 ring-violet-600/20" },
  TAXI:           { label: "מונית",      icon: <Car size={14} />,   badge: "bg-amber-100 text-amber-700 ring-amber-600/20" },
  PRIVATE_DRIVER: { label: "נהג פרטי",   icon: <User size={14} />,  badge: "bg-rose-100 text-rose-700 ring-rose-600/20" },
};

function TransportationSection({ trip }: { trip: TripDTO }) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanMsg, setScanMsg] = useState<string | null>(null);
  const items = trip.transportation ?? [];

  async function scanDocs() {
    setScanning(true);
    setScanMsg(null);
    try {
      const res = await fetch(`/api/trips/${trip.id}/transportation/scan-docs`, { method: "POST" });
      const data = await res.json();
      setScanMsg(data.message ?? "הסריקה הסתיימה");
      if (data.added > 0) router.refresh();
    } catch {
      setScanMsg("אירעה שגיאה בסריקת המסמכים");
    } finally {
      setScanning(false);
    }
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-bold text-ink-900">
          <Car size={18} /> תחבורה
        </h2>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={scanDocs}
            disabled={scanning}
            className="gap-1.5 text-xs border-amber-200 text-amber-700 hover:bg-amber-50"
          >
            {scanning ? <Loader2 size={13} className="animate-spin" /> : <Search size={13} />}
            סרוק מסמכים
          </Button>
          <Button size="sm" variant="secondary" onClick={() => setAdding(true)}>
            <Plus size={14} /> הוסף תחבורה
          </Button>
        </div>
      </div>

      {scanMsg && (
        <div className={cn(
          "mb-3 rounded-lg border px-3 py-2 text-xs",
          scanMsg.includes("נמצאו") ? "border-green-200 bg-green-50 text-green-700" : "border-amber-200 bg-amber-50 text-amber-700"
        )}>
          {scanMsg}
        </div>
      )}

      {items.length === 0 && !adding && (
        <EmptyState
          icon={<Car size={32} />}
          title="לא נוספה תחבורה"
          hint="הוסף השכרות רכב, נסיעות אוטובוס/רכבת, שאטלים, מוניות ועוד."
        />
      )}

      <div className="space-y-3">
        {items.map((t) => (
          <TransportCard key={t.id} item={t} onChange={() => router.refresh()} />
        ))}
      </div>

      {adding && (
        <TransportForm
          tripId={trip.id}
          onDone={() => { setAdding(false); router.refresh(); }}
          onCancel={() => setAdding(false)}
        />
      )}
    </div>
  );
}

function TransportCard({ item, onChange }: { item: TransportationDTO; onChange: () => void }) {
  const meta = TRANSPORT_META[item.type] ?? { label: item.type, icon: <Car size={14} />, badge: "bg-ink-100 text-ink-600 ring-ink-500/20" };

  async function remove() {
    await fetch(`/api/transportation/${item.id}`, { method: "DELETE" });
    onChange();
  }

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Badge className={cn(meta.badge, "gap-1")}>
            {meta.icon}{meta.label}
          </Badge>
          {item.date && <span className="text-xs text-ink-500">{formatDate(item.date)}</span>}
        </div>
        <button onClick={remove} className="rounded p-1 text-ink-300 hover:bg-rose-50 hover:text-rose-500">
          <Trash2 size={15} />
        </button>
      </div>
      <div className="mt-3 space-y-1.5 text-sm text-ink-600">
        {(item.fromLocation || item.toLocation) && (
          <div className="flex items-center gap-1.5">
            <MapPin size={13} className="shrink-0 text-ink-400" />
            {item.fromLocation && <span>{item.fromLocation}</span>}
            {item.fromLocation && item.toLocation && <span className="mx-0.5 text-ink-400">→</span>}
            {item.toLocation && <span>{item.toLocation}</span>}
          </div>
        )}
        {item.fromLocation && (
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-ink-400">לנקודת היציאה:</span>
            <NavButtons target={{ name: item.fromLocation }} />
          </div>
        )}
        {(item.departureTime || item.arrivalTime) && (
          <div className="text-xs text-ink-500">
            {item.departureTime && <span>יציאה: {item.departureTime}</span>}
            {item.departureTime && item.arrivalTime && <span className="mx-1">·</span>}
            {item.arrivalTime && <span>הגעה: {item.arrivalTime}</span>}
          </div>
        )}
        {item.company && <div className="text-xs text-ink-500">חברה: {item.company}</div>}
        {item.vehicle && <div className="text-xs text-ink-500">סוג רכב: {item.vehicle}</div>}
        {item.reference && (
          <div className="text-xs text-ink-400">
            אישור: <span className="font-mono">{item.reference}</span>
          </div>
        )}
        {(item.contactName || item.contactPhone) && (
          <div className="flex items-center gap-1.5 text-xs text-ink-500">
            <Phone size={12} className="text-ink-400" />
            {item.contactName && <span>{item.contactName}</span>}
            {item.contactPhone && (
              <a href={`tel:${item.contactPhone}`} className="text-brand-600 hover:underline">
                {item.contactPhone}
              </a>
            )}
          </div>
        )}
        {item.documents && <div className="text-xs text-ink-500">מסמכים: {item.documents}</div>}
        {item.notes && <p className="text-xs italic text-ink-400">{item.notes}</p>}
      </div>
    </Card>
  );
}

interface TransportFormState {
  type: string;
  date: string;
  fromLocation: string;
  toLocation: string;
  departureTime: string;
  arrivalTime: string;
  company: string;
  reference: string;
  vehicle: string;
  documents: string;
  contactName: string;
  contactPhone: string;
  notes: string;
}

const FIELDS_BY_TYPE: Record<string, (keyof TransportFormState)[]> = {
  CAR_RENTAL:     ["date", "fromLocation", "toLocation", "departureTime", "arrivalTime", "company", "vehicle", "reference", "documents", "notes"],
  BUS:            ["date", "fromLocation", "toLocation", "departureTime", "arrivalTime", "company", "reference", "notes"],
  TRAIN:          ["date", "fromLocation", "toLocation", "departureTime", "arrivalTime", "company", "reference", "notes"],
  SHUTTLE:        ["date", "fromLocation", "toLocation", "departureTime", "arrivalTime", "company", "contactName", "contactPhone", "reference", "notes"],
  TAXI:           ["date", "fromLocation", "toLocation", "departureTime", "contactName", "contactPhone", "reference", "notes"],
  PRIVATE_DRIVER: ["date", "fromLocation", "toLocation", "departureTime", "contactName", "contactPhone", "notes"],
};

const FIELD_LABELS: Record<string, Partial<Record<keyof TransportFormState, string>>> = {
  CAR_RENTAL:     { fromLocation: "מיקום איסוף", toLocation: "מיקום החזרה", departureTime: "שעת איסוף", arrivalTime: "שעת החזרה", company: "חברת השכרה", reference: "מספר אישור" },
  BUS:            { fromLocation: "תחנת יציאה", toLocation: "תחנת הגעה", company: "חברת אוטובוסים", reference: "מספר קו / הזמנה" },
  TRAIN:          { fromLocation: "תחנת יציאה", toLocation: "תחנת הגעה", company: "מפעיל", reference: "מספר רכבת / הזמנה" },
  SHUTTLE:        { fromLocation: "מיקום איסוף", toLocation: "מיקום יעד", contactName: "שם איש קשר", reference: "מספר הזמנה", arrivalTime: "שעת הגעה" },
  TAXI:           { fromLocation: "מיקום איסוף", toLocation: "מיקום יעד", contactName: "שם נהג", reference: "מספר הזמנה" },
  PRIVATE_DRIVER: { fromLocation: "מיקום איסוף", toLocation: "מיקום יעד", contactName: "שם נהג" },
};

const DEFAULT_LABELS: Partial<Record<keyof TransportFormState, string>> = {
  date: "תאריך",
  fromLocation: "מ",
  toLocation: "ל",
  departureTime: "שעת יציאה",
  arrivalTime: "שעת הגעה",
  company: "חברה",
  reference: "מספר אישור",
  vehicle: "סוג רכב",
  documents: "מסמכים נדרשים",
  contactName: "שם איש קשר",
  contactPhone: "טלפון",
  notes: "הערות",
};

function getLabel(field: keyof TransportFormState, type: string): string {
  return FIELD_LABELS[type]?.[field] ?? DEFAULT_LABELS[field] ?? field;
}

function TransportForm({ tripId, onDone, onCancel }: { tripId: string; onDone: () => void; onCancel: () => void }) {
  const [form, setForm] = useState<TransportFormState>({
    type: "CAR_RENTAL",
    date: "", fromLocation: "", toLocation: "",
    departureTime: "", arrivalTime: "",
    company: "", reference: "", vehicle: "",
    documents: "", contactName: "", contactPhone: "", notes: "",
  });
  const [saving, setSaving] = useState(false);
  const setF = (k: keyof TransportFormState, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const fields = FIELDS_BY_TYPE[form.type] ?? [];
  const has = (f: keyof TransportFormState) => fields.includes(f);

  async function save() {
    setSaving(true);
    await fetch(`/api/trips/${tripId}/transportation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    onDone();
  }

  return (
    <Card className="mt-3 space-y-3 p-4">
      {/* Type selector */}
      <div>
        <Label>סוג תחבורה</Label>
        <div className="mt-1 flex flex-wrap gap-2">
          {Object.entries(TRANSPORT_META).map(([value, meta]) => (
            <button
              key={value}
              type="button"
              onClick={() => setF("type", value)}
              className={cn(
                "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                form.type === value
                  ? "border-brand-300 bg-brand-50 text-brand-700"
                  : "border-ink-200 bg-white text-ink-600 hover:bg-ink-50"
              )}
            >
              {meta.icon}
              {meta.label}
            </button>
          ))}
        </div>
      </div>

      {/* Date */}
      {has("date") && (
        <div>
          <Label>{getLabel("date", form.type)}</Label>
          <Input type="date" value={form.date} onChange={(e) => setF("date", e.target.value)} />
        </div>
      )}

      {/* From / To */}
      {(has("fromLocation") || has("toLocation")) && (
        <div className="grid grid-cols-2 gap-2">
          {has("fromLocation") && (
            <div>
              <Label>{getLabel("fromLocation", form.type)}</Label>
              <Input value={form.fromLocation} onChange={(e) => setF("fromLocation", e.target.value)} />
            </div>
          )}
          {has("toLocation") && (
            <div>
              <Label>{getLabel("toLocation", form.type)}</Label>
              <Input value={form.toLocation} onChange={(e) => setF("toLocation", e.target.value)} />
            </div>
          )}
        </div>
      )}

      {/* Times */}
      {(has("departureTime") || has("arrivalTime")) && (
        <div className="grid grid-cols-2 gap-2">
          {has("departureTime") && (
            <div>
              <Label>{getLabel("departureTime", form.type)}</Label>
              <Input type="time" value={form.departureTime} onChange={(e) => setF("departureTime", e.target.value)} />
            </div>
          )}
          {has("arrivalTime") && (
            <div>
              <Label>{getLabel("arrivalTime", form.type)}</Label>
              <Input type="time" value={form.arrivalTime} onChange={(e) => setF("arrivalTime", e.target.value)} />
            </div>
          )}
        </div>
      )}

      {/* Company + Vehicle */}
      {(has("company") || has("vehicle")) && (
        <div className={cn("gap-2", has("company") && has("vehicle") ? "grid grid-cols-2" : "")}>
          {has("company") && (
            <div>
              <Label>{getLabel("company", form.type)}</Label>
              <Input value={form.company} onChange={(e) => setF("company", e.target.value)} />
            </div>
          )}
          {has("vehicle") && (
            <div>
              <Label>{getLabel("vehicle", form.type)}</Label>
              <Input value={form.vehicle} onChange={(e) => setF("vehicle", e.target.value)} placeholder="פנדה, יאריס..." />
            </div>
          )}
        </div>
      )}

      {/* Contact */}
      {(has("contactName") || has("contactPhone")) && (
        <div className="grid grid-cols-2 gap-2">
          {has("contactName") && (
            <div>
              <Label>{getLabel("contactName", form.type)}</Label>
              <Input value={form.contactName} onChange={(e) => setF("contactName", e.target.value)} />
            </div>
          )}
          {has("contactPhone") && (
            <div>
              <Label>{getLabel("contactPhone", form.type)}</Label>
              <Input type="tel" value={form.contactPhone} onChange={(e) => setF("contactPhone", e.target.value)} />
            </div>
          )}
        </div>
      )}

      {/* Reference */}
      {has("reference") && (
        <div>
          <Label>{getLabel("reference", form.type)}</Label>
          <Input value={form.reference} onChange={(e) => setF("reference", e.target.value)} className="font-mono" />
        </div>
      )}

      {/* Documents */}
      {has("documents") && (
        <div>
          <Label>{getLabel("documents", form.type)}</Label>
          <Input value={form.documents} onChange={(e) => setF("documents", e.target.value)} placeholder="רישיון נהיגה בינלאומי, פספורט..." />
        </div>
      )}

      {/* Notes */}
      {has("notes") && (
        <div>
          <Label>{getLabel("notes", form.type)}</Label>
          <Input value={form.notes} onChange={(e) => setF("notes", e.target.value)} />
        </div>
      )}

      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={onCancel}>
          <X size={14} /> ביטול
        </Button>
        <Button size="sm" onClick={save} disabled={saving}>
          {saving && <Loader2 size={14} className="animate-spin" />} הוסף
        </Button>
      </div>
    </Card>
  );
}
