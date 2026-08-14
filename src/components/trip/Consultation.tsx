"use client";

import { useEffect, useState } from "react";
import {
  Sparkles,
  Compass,
  Backpack,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { Button, Card } from "@/components/ui";
import { Markdown } from "@/components/Markdown";

export function Consultation({ tripId }: { tripId: string }) {
  // ── Analyzer State ──────────────────────────────────────────────────────────
  const [analyzerResult, setAnalyzerResult] = useState<string | null>(null);
  const [analyzerLoading, setAnalyzerLoading] = useState(false);
  const [analyzerError, setAnalyzerError] = useState<string | null>(null);
  const [analyzerNote, setAnalyzerNote] = useState("");

  // ── Packing State ───────────────────────────────────────────────────────────
  const [packingResult, setPackingResult] = useState<string | null>(null);
  const [packingLoading, setPackingLoading] = useState(false);
  const [packingError, setPackingError] = useState<string | null>(null);
  const [packingNote, setPackingNote] = useState("");

  // ── Fetch saved results on mount (silent – no spinner) ────────────────────
  useEffect(() => {
    let alive = true;

    async function loadSaved() {
      // 1. Fetch analyzer (silently – no loading state)
      try {
        const resA = await fetch(`/api/trips/${tripId}/consult?skill=analyzer`);
        if (resA.ok) {
          const dataA = await resA.json();
          if (alive && dataA.result) setAnalyzerResult(dataA.result);
        }
      } catch {
        // ignore
      }

      // 2. Fetch packing (silently – no loading state)
      try {
        const resP = await fetch(`/api/trips/${tripId}/consult?skill=packing`);
        if (resP.ok) {
          const dataP = await resP.json();
          if (alive && dataP.result) setPackingResult(dataP.result);
        }
      } catch {
        // ignore
      }
    }

    loadSaved();

    return () => {
      alive = false;
    };
  }, [tripId]);

  // ── Generator & Updater functions ─────────────────────────────────────────
  async function generateAnalyzer(note = "") {
    setAnalyzerLoading(true);
    setAnalyzerError(null);
    try {
      const res = await fetch(`/api/trips/${tripId}/consult`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skill: "analyzer", question: note }),
      });
      const data = await res.json();
      if (res.ok) {
        setAnalyzerResult(data.result);
        setAnalyzerNote("");
      } else {
        setAnalyzerError(data.error ?? "אירעה שגיאה ביצירת הניתוח");
      }
    } catch {
      setAnalyzerError("אירעה שגיאה ביצירת הניתוח");
    } finally {
      setAnalyzerLoading(false);
    }
  }

  async function generatePacking(note = "") {
    setPackingLoading(true);
    setPackingError(null);
    try {
      const res = await fetch(`/api/trips/${tripId}/consult`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skill: "packing", question: note }),
      });
      const data = await res.json();
      if (res.ok) {
        setPackingResult(data.result);
        setPackingNote("");
      } else {
        setPackingError(data.error ?? "אירעה שגיאה ביצירת רשימת האריזה");
      }
    } catch {
      setPackingError("אירעה שגיאה ביצירת רשימת האריזה");
    } finally {
      setPackingLoading(false);
    }
  }

  // Save modified packing list (e.g. checkbox state toggle)
  async function updatePackingContent(newContent: string) {
    setPackingResult(newContent);
    try {
      await fetch(`/api/trips/${tripId}/consult`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skill: "packing", content: newContent }),
      });
    } catch {
      // silently fail if network drops
    }
  }

  return (
    <div className="space-y-8 pb-12" dir="rtl">
      {/* ── SECTION 1: מנתח מסלול ─────────────────────────────────────────── */}
      <Card className="overflow-hidden border border-white/60 bg-white/90 p-6 shadow-md backdrop-blur-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
              <Compass size={22} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-zinc-900">מנתח מסלול חכם</h2>
              <p className="text-xs text-zinc-500">
                ניתוח מעמיק של התוכנית והיעדים, עם טיוב והתאמות מומלצות למסלול שלך.
              </p>
            </div>
          </div>

          <Button
            onClick={() => generateAnalyzer(analyzerNote)}
            disabled={analyzerLoading}
            variant="secondary"
            className="gap-2 text-xs font-bold border-blue-200 text-blue-700 hover:bg-blue-50"
          >
            {analyzerLoading ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <RefreshCw size={15} />
            )}
            {analyzerResult ? "עדכן ניתוח מסלול" : "צור ניתוח מסלול"}
          </Button>
        </div>

        {/* Content area */}
        {analyzerLoading && !analyzerResult ? (
          <div className="flex py-12 flex-col items-center justify-center gap-3 text-zinc-400">
            <Loader2 size={32} className="animate-spin text-blue-600" />
            <p className="text-sm font-medium">מנתח את הנתונים...</p>
          </div>
        ) : analyzerError ? (
          <div className="rounded-xl bg-red-50 p-4 text-sm text-red-600 border border-red-100">
            {analyzerError}
          </div>
        ) : analyzerResult ? (
          <div className="space-y-4">
            <div className="rounded-2xl bg-slate-50/80 p-5 border border-zinc-100">
              <Markdown content={analyzerResult} />
            </div>

            {/* Request modification note */}
            <div className="pt-2 flex flex-col sm:flex-row items-center gap-2">
              <input
                type="text"
                value={analyzerNote}
                onChange={(e) => setAnalyzerNote(e.target.value)}
                placeholder="רוצה התאמה ספציפית? (למשל: 'התמקד בהמלצות קולינריות' או 'שפר את יום 2')"
                className="w-full sm:flex-1 rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-xs text-zinc-800 placeholder:text-zinc-400 focus:border-blue-500 focus:outline-none"
              />
              <Button
                onClick={() => generateAnalyzer(analyzerNote)}
                disabled={analyzerLoading || !analyzerNote.trim()}
                className="w-full sm:w-auto text-xs font-bold bg-blue-600 hover:bg-blue-700"
              >
                <RefreshCw size={14} className="ml-1" />
                עדכן
              </Button>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-zinc-200 bg-slate-50/50 p-8 text-center space-y-3">
            <Compass size={40} className="mx-auto text-zinc-300" />
            <p className="text-sm text-zinc-600">טרם נוצר ניתוח מסלול לטיול זה.</p>
            <Button
              onClick={() => generateAnalyzer()}
              disabled={analyzerLoading}
              className="bg-blue-600 hover:bg-blue-700 text-xs font-bold gap-2"
            >
              <Sparkles size={15} />
              צור ניתוח מסלול עכשיו
            </Button>
          </div>
        )}
      </Card>

      {/* ── SECTION 2: עוזר אריזה חכם ──────────────────────────────────────── */}
      <Card className="overflow-hidden border border-white/60 bg-white/90 p-6 shadow-md backdrop-blur-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
              <Backpack size={22} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-zinc-900">עוזר אריזה חכם</h2>
              <p className="text-xs text-zinc-500">
                רשימת ציוד מותאמת אישית ליעד, לעונה ולתאריכים. סמן V כשאתה אורז – הנתונים נשמרים אוטומטית!
              </p>
            </div>
          </div>

          <Button
            onClick={() => generatePacking(packingNote)}
            disabled={packingLoading}
            variant="secondary"
            className="gap-2 text-xs font-bold border-emerald-200 text-emerald-700 hover:bg-emerald-50"
          >
            {packingLoading ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <RefreshCw size={15} />
            )}
            {packingResult ? "עדכן רשימת אריזה" : "צור רשימת אריזה"}
          </Button>
        </div>

        {/* Content area */}
        {packingLoading && !packingResult ? (
          <div className="flex py-12 flex-col items-center justify-center gap-3 text-zinc-400">
            <Loader2 size={32} className="animate-spin text-emerald-600" />
            <p className="text-sm font-medium">מנתח את הנתונים...</p>
          </div>
        ) : packingError ? (
          <div className="rounded-xl bg-red-50 p-4 text-sm text-red-600 border border-red-100">
            {packingError}
          </div>
        ) : packingResult ? (
          <div className="space-y-4">
            <div className="rounded-2xl bg-emerald-50/40 p-5 border border-emerald-100/60">
              <Markdown content={packingResult} onContentChange={updatePackingContent} />
            </div>

            {/* Request modification note */}
            <div className="pt-2 flex flex-col sm:flex-row items-center gap-2">
              <input
                type="text"
                value={packingNote}
                onChange={(e) => setPackingNote(e.target.value)}
                placeholder="רוצה להוסיף ציוד ספציפי? (למשל: 'הוסף ציוד צלילה' או 'עונת חורף מושלגת')"
                className="w-full sm:flex-1 rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-xs text-zinc-800 placeholder:text-zinc-400 focus:border-emerald-500 focus:outline-none"
              />
              <Button
                onClick={() => generatePacking(packingNote)}
                disabled={packingLoading || !packingNote.trim()}
                className="w-full sm:w-auto text-xs font-bold bg-emerald-600 hover:bg-emerald-700"
              >
                <RefreshCw size={14} className="ml-1" />
                עדכן
              </Button>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-zinc-200 bg-slate-50/50 p-8 text-center space-y-3">
            <Backpack size={40} className="mx-auto text-zinc-300" />
            <p className="text-sm text-zinc-600">טרם נוצרה רשימת אריזה לטיול זה.</p>
            <Button
              onClick={() => generatePacking()}
              disabled={packingLoading}
              className="bg-emerald-600 hover:bg-emerald-700 text-xs font-bold gap-2"
            >
              <Sparkles size={15} />
              צור רשימת אריזה עכשיו
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
