"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Users, Search, Copy, Calendar, MapPin, Loader2, Sparkles, Eye, Check } from "lucide-react";
import { Button, Card, Input } from "@/components/ui";
import { SetBackground } from "@/components/background/BackgroundProvider";

interface CommunityTrip {
  id: string;
  title: string;
  destination: string;
  country: string;
  coverImage?: string | null;
  startDate: string;
  endDate: string;
  cloneCount: number;
  daysCount: number;
  placesCount: number;
  author: {
    name: string;
    picture?: string | null;
  };
}

export default function CommunityPage() {
  const router = useRouter();
  const [trips, setTrips] = useState<CommunityTrip[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCountry, setSelectedCountry] = useState<string>("ALL");

  // Clone Modal state
  const [cloneTripId, setCloneTripId] = useState<string | null>(null);
  const [cloneTripTitle, setCloneTripTitle] = useState<string>("");
  const [startDateInput, setStartDateInput] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [isCloning, setIsCloning] = useState(false);

  useEffect(() => {
    fetchTrips();
  }, [selectedCountry]);

  async function fetchTrips(q = searchQuery) {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q.trim()) params.append("q", q.trim());
      if (selectedCountry !== "ALL") params.append("country", selectedCountry);

      const res = await fetch(`/api/community?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setTrips(data);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  async function handleClone() {
    if (!cloneTripId) return;
    setIsCloning(true);
    try {
      const res = await fetch(`/api/trips/${cloneTripId}/clone`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startDate: startDateInput }),
      });

      if (res.ok) {
        const newTrip = await res.json();
        router.push(`/trips/${newTrip.id}`);
      } else {
        alert("שגיאה בהעתקת הטיול");
        setIsCloning(false);
      }
    } catch {
      alert("שגיאה בהעתקת הטיול");
      setIsCloning(false);
    }
  }

  // Get list of unique countries for filter pills
  const countries = Array.from(new Set(trips.map((t) => t.country))).filter(Boolean);

  return (
    <>
      <SetBackground name="community" />
      <div className="space-y-8 pb-16">
        {/* Header Banner */}
        <div className="relative overflow-hidden rounded-2xl md:rounded-3xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 p-5 md:p-10 text-white shadow-xl">
          <div className="relative z-10 max-w-2xl space-y-2 md:space-y-4">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] md:text-xs font-semibold backdrop-blur-md border border-white/20">
              <Sparkles size={13} className="text-yellow-400" />
              <span>קהילת TravelPlanner</span>
            </div>
            <h1 className="text-2xl font-extrabold md:text-5xl">
              טיולים מומלצים מהקהילה
            </h1>
            <p className="text-zinc-300 text-xs sm:text-sm md:text-lg leading-relaxed">
              עיין במסלולי טיול מומלצים ששותפו על ידי מטיילים אחרים, העתק אותם בלחיצת כפתור והתאם אותם לטיול הבא שלך!
            </p>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center justify-between">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              fetchTrips();
            }}
            className="relative flex-1 max-w-md"
          >
            <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="חפש לפי שם טיול, יעד או מדינה..."
              className="pr-10 bg-white/80 backdrop-blur-sm"
            />
          </form>

          {/* Country filter pills */}
          {countries.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              <button
                onClick={() => setSelectedCountry("ALL")}
                className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
                  selectedCountry === "ALL"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-white/80 text-zinc-600 hover:bg-white"
                }`}
              >
                הכל
              </button>
              {countries.map((c) => (
                <button
                  key={c}
                  onClick={() => setSelectedCountry(c)}
                  className={`rounded-full px-4 py-1.5 text-xs font-semibold whitespace-nowrap transition-all ${
                    selectedCountry === c
                      ? "bg-blue-600 text-white shadow-sm"
                      : "bg-white/80 text-zinc-600 hover:bg-white"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Trips Grid */}
        {loading ? (
          <div className="flex justify-center py-20 text-zinc-400">
            <Loader2 size={32} className="animate-spin text-blue-500" />
          </div>
        ) : trips.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-200 bg-white/50 p-12 text-center">
            <Users size={48} className="mx-auto mb-3 text-zinc-300" />
            <h3 className="text-lg font-bold text-zinc-700">אין טיולים ששותפו עדיין</h3>
            <p className="text-sm text-zinc-500 max-w-md mx-auto mt-1">
              היית הראשון לשתף טיול! כנס לאחד הטיולים שלך ולחץ על כפתור "שתף לקהילה".
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {trips.map((t) => (
              <Card
                key={t.id}
                className="group overflow-hidden border border-zinc-100 bg-white/90 shadow-sm hover:shadow-md transition-all flex flex-col"
              >
                {/* Cover Image Header */}
                <div className="relative h-44 w-full bg-slate-800 overflow-hidden">
                  {t.coverImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={t.coverImage}
                      alt={t.title}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-br from-blue-700 via-indigo-800 to-slate-900 flex items-center justify-center p-4 text-center">
                      <span className="text-xl font-black text-white/90">{t.destination}</span>
                    </div>
                  )}

                  <div className="absolute top-3 right-3 flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1 text-xs font-medium text-white backdrop-blur-md">
                    <MapPin size={12} className="text-yellow-400" />
                    <span>{t.country}</span>
                  </div>

                  {t.cloneCount > 0 && (
                    <div className="absolute bottom-3 left-3 flex items-center gap-1 rounded-full bg-emerald-500/90 px-2.5 py-0.5 text-[11px] font-bold text-white shadow-sm">
                      <Copy size={11} />
                      <span>הועתק {t.cloneCount} פעמים</span>
                    </div>
                  )}
                </div>

                {/* Body Details */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <h3 className="text-lg font-bold text-zinc-900 line-clamp-1 group-hover:text-blue-600 transition-colors">
                      {t.title}
                    </h3>
                    
                    <div className="flex items-center gap-4 text-xs text-zinc-500 font-medium">
                      <div className="flex items-center gap-1">
                        <Calendar size={14} className="text-blue-500" />
                        <span>{t.daysCount} ימים</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin size={14} className="text-emerald-500" />
                        <span>{t.placesCount} מקומות</span>
                      </div>
                    </div>
                  </div>

                  {/* Author & Action buttons */}
                  <div className="pt-3 border-t border-zinc-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {t.author.picture ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={t.author.picture}
                          alt={t.author.name}
                          referrerPolicy="no-referrer"
                          className="h-6 w-6 rounded-full object-cover ring-1 ring-zinc-200"
                        />
                      ) : (
                        <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center text-[10px] font-bold text-blue-600">
                          {t.author.name.charAt(0)}
                        </div>
                      )}
                      <span className="text-xs font-medium text-zinc-600 truncate max-w-[90px]">
                        {t.author.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/trips/${t.id}`}
                        className="p-2 text-zinc-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="תצוגה מקדימה"
                      >
                        <Eye size={18} />
                      </Link>
                      <Button
                        size="sm"
                        onClick={() => {
                          setCloneTripId(t.id);
                          setCloneTripTitle(t.title);
                        }}
                        className="gap-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm"
                      >
                        <Copy size={14} />
                        שתמש בטיול
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Clone Modal */}
      {cloneTripId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" dir="rtl">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 border-b border-zinc-100 pb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                <Copy size={20} />
              </div>
              <div>
                <h3 className="font-bold text-lg text-zinc-900">העתקת טיול לחשבון שלך</h3>
                <p className="text-xs text-zinc-500">{cloneTripTitle}</p>
              </div>
            </div>

            <p className="text-sm text-zinc-600">
              הטיול יועתק לחשבון האישי שלך. תוכל לערוך ולהתאים את כל המסלול והמקומות מבלי להשפיע על המקור.
            </p>

            <div className="space-y-2">
              <label htmlFor="cloneStartDate" className="text-xs font-semibold text-zinc-700">
                תאריך התחלה לטיול החדש שלך
              </label>
              <Input
                id="cloneStartDate"
                type="date"
                value={startDateInput}
                onChange={(e) => setStartDateInput(e.target.value)}
                className="w-full"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="secondary"
                onClick={() => setCloneTripId(null)}
                disabled={isCloning}
              >
                ביטול
              </Button>
              <Button onClick={handleClone} disabled={isCloning} className="bg-blue-600 hover:bg-blue-700">
                {isCloning ? (
                  <>
                    <Loader2 size={16} className="ml-2 animate-spin" />
                    מעתיק טיול...
                  </>
                ) : (
                  <>
                    <Check size={16} className="ml-1.5" />
                    העתק והתחל לתכנן
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
