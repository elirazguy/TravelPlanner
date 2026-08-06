"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, X, Loader2, Sparkles, RefreshCw } from "lucide-react";
import { Button, Input, Label, Textarea } from "./ui";
import { DateRangePicker } from "./DateRangePicker";

interface EditTripModalProps {
  trip: {
    id: string;
    title: string;
    destination: string;
    notes: string | null;
    startDate: string;
    endDate: string;
    coverImage: string | null;
  };
}

export function EditTripModal({ trip }: EditTripModalProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generatingCover, setGeneratingCover] = useState(false);
  const [form, setForm] = useState({
    title: trip.title,
    destination: trip.destination,
    startDate: trip.startDate.slice(0, 10),
    endDate: trip.endDate.slice(0, 10),
    notes: trip.notes ?? "",
  });

  function update(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function openModal() {
    // Reset to the current trip values each time it opens.
    setForm({
      title: trip.title,
      destination: trip.destination,
      startDate: trip.startDate.slice(0, 10),
      endDate: trip.endDate.slice(0, 10),
      notes: trip.notes ?? "",
    });
    setOpen(true);
  }

  async function submit(forceCover = false) {
    if (!form.title || !form.destination || !form.startDate || !form.endDate) return;
    setSaving(true);

    const res = await fetch(`/api/trips/${trip.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (!res.ok) {
      setSaving(false);
      return;
    }

    // Find a cover when the trip has none, or when the user asked to re-roll it
    // (using the updated destination + style notes). Non-blocking failure.
    if (forceCover || !trip.coverImage) {
      setGeneratingCover(true);
      setSaving(false);
      try {
        const coverRes = await fetch("/api/generate-cover", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            destination: form.destination,
            title: form.title,
            notes: form.notes,
          }),
        });
        if (coverRes.ok) {
          const { url } = await coverRes.json();
          await fetch(`/api/trips/${trip.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ coverImage: url }),
          });
        }
      } catch {
        // ignore — details still saved
      }
      setGeneratingCover(false);
    } else {
      setSaving(false);
    }

    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <Button variant="secondary" size="sm" onClick={openModal} className="whitespace-nowrap shrink-0">
        <Pencil size={14} /> ערוך פרטים
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-ink-100 px-5 py-4">
              <h2 className="text-lg font-bold text-ink-900">ערוך פרטי טיול</h2>
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg p-1 text-ink-400 hover:bg-ink-100"
              >
                <X size={18} />
              </button>
            </div>
            <div className="space-y-4 px-5 py-5">
              <div>
                <Label>שם הטיול</Label>
                <Input
                  value={form.title}
                  onChange={(e) => update("title", e.target.value)}
                />
              </div>
              <div>
                <Label>יעד (עיר, מדינה)</Label>
                <Input
                  value={form.destination}
                  onChange={(e) => update("destination", e.target.value)}
                />
              </div>
              <div>
                <Label>תאריכי הטיול</Label>
                <DateRangePicker
                  startDate={form.startDate}
                  endDate={form.endDate}
                  onChange={(start, end) =>
                    setForm((f) => ({ ...f, startDate: start, endDate: end }))
                  }
                />
              </div>
              <div>
                <Label>הערות / סגנון נסיעה (אופציונלי)</Label>
                <Textarea
                  rows={2}
                  placeholder="אוהב אוכל, עיצוב, מקדשים שקטים..."
                  value={form.notes}
                  onChange={(e) => update("notes", e.target.value)}
                />
              </div>

              {!trip.coverImage ? (
                <div className="flex items-center gap-2 rounded-lg bg-brand-50 px-3 py-2 text-xs text-brand-700">
                  <Sparkles size={13} />
                  לטיול אין עדיין תמונה — ה-AI ייצור תמונה מותאמת לפי היעד והסגנון אחרי השמירה.
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => submit(true)}
                  disabled={saving || generatingCover}
                  className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-brand-200 bg-brand-50 px-3 py-2 text-xs font-medium text-brand-700 hover:bg-brand-100 disabled:opacity-60"
                >
                  <RefreshCw size={13} />
                  צור תמונה חדשה לפי היעד והסגנון (יישמר עם השינויים)
                </button>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-ink-100 px-5 py-4">
              {generatingCover && (
                <div className="flex items-center gap-1.5 text-xs text-ink-500">
                  <Loader2 size={13} className="animate-spin" />
                  יוצר תמונה מתאימה...
                </div>
              )}
              <Button
                variant="secondary"
                onClick={() => setOpen(false)}
                disabled={saving || generatingCover}
              >
                ביטול
              </Button>
              <Button onClick={() => submit()} disabled={saving || generatingCover}>
                {saving && <Loader2 size={16} className="animate-spin" />}
                {saving ? "שומר..." : "שמור שינויים"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
