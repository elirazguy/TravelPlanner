"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, Loader2, Sparkles } from "lucide-react";
import { Button, Input, Label, Textarea } from "./ui";
import { DateRangePicker } from "./DateRangePicker";

export function NewTripModal() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generatingCover, setGeneratingCover] = useState(false);
  const [form, setForm] = useState({
    title: "",
    destination: "",
    startDate: "",
    endDate: "",
    notes: "",
  });

  function update(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function reset() {
    setForm({ title: "", destination: "", startDate: "", endDate: "", notes: "" });
    setGeneratingCover(false);
    setSaving(false);
  }

  async function submit() {
    if (!form.title || !form.destination || !form.startDate || !form.endDate) return;
    setSaving(true);

    // Create the trip.
    const res = await fetch("/api/trips", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (!res.ok) { setSaving(false); return; }
    const trip = await res.json();

    // Navigate immediately so user doesn't wait
    setOpen(false);
    reset();
    router.push(`/trips/${trip.id}`);

    // Generate AI cover image asynchronously in the background
    fetch("/api/generate-cover", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ destination: form.destination, title: form.title, notes: form.notes }),
    })
      .then(async (coverRes) => {
        if (coverRes.ok) {
          const { url } = await coverRes.json();
          await fetch(`/api/trips/${trip.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ coverImage: url }),
          });
          // Refresh router so the image pops in if the user is on the trip page
          router.refresh();
        }
      })
      .catch(() => {
        // Generation failed — trip still created without cover image.
      });
  }

  return (
    <>
      <Button onClick={() => setOpen(true)} size="sm" className="whitespace-nowrap shrink-0 text-xs font-bold px-3 py-1.5 gap-1 shadow-sm">
        <Plus size={14} /> טיול חדש
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-ink-100 px-5 py-4">
              <h2 className="text-lg font-bold text-ink-900">תכנן טיול חדש</h2>
              <button onClick={() => { setOpen(false); reset(); }} className="rounded-lg p-1 text-ink-400 hover:bg-ink-100">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-4 px-5 py-5">
              <div>
                <Label>שם הטיול</Label>
                <Input
                  placeholder="פריחת הדובדבן בטוקיו"
                  value={form.title}
                  onChange={(e) => update("title", e.target.value)}
                />
              </div>
              <div>
                <Label>יעד (עיר, מדינה)</Label>
                <Input
                  placeholder="טוקיו, יפן"
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

              {/* AI cover note */}
              <div className="flex items-center gap-2 rounded-lg bg-brand-50 px-3 py-2 text-xs text-brand-700">
                <Sparkles size={13} />
                ה-AI ייצור תמונת כותרת מותאמת ליעד ולסגנון הנסיעה אוטומטית.
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-ink-100 px-5 py-4">
              {generatingCover && (
                <div className="flex items-center gap-1.5 text-xs text-ink-500">
                  <Loader2 size={13} className="animate-spin" />
                  יוצר תמונת כותרת מותאמת...
                </div>
              )}
              <Button variant="secondary" onClick={() => { setOpen(false); reset(); }} disabled={saving || generatingCover}>
                ביטול
              </Button>
              <Button onClick={submit} disabled={saving || generatingCover}>
                {saving && <Loader2 size={16} className="animate-spin" />}
                {saving ? "יוצר..." : "צור טיול"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
