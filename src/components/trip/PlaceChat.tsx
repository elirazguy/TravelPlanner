"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import {
  X,
  Send,
  ImagePlus,
  Loader2,
  Sparkles,
  Check,
  Bookmark,
} from "lucide-react";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";
import {
  SAVED_PLACE_CATEGORY_META,
  type SavedPlaceCategory,
} from "@/lib/constants";

interface EnrichedPlace {
  name: string;
  category: SavedPlaceCategory;
  note?: string;
  address?: string;
  lat?: number;
  lng?: number;
  placeId?: string;
}

interface ChatMessage {
  role: "user" | "assistant";
  text: string;
  imagePreview?: string;
  isError?: boolean;
}

interface PickedPlace extends EnrichedPlace {
  cid: string;
}

function readDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// Downscale + re-encode the image client-side to a JPEG so the request payload
// stays small (phone screenshots are often several MB) and the format is one
// Gemini always supports. Throws if the browser cannot decode the file (e.g.
// an iPhone HEIC), so the caller can show a helpful message rather than sending
// an unsupported image.
async function processImage(
  file: File
): Promise<{ base64: string; mime: string; dataUrl: string }> {
  const original = await readDataUrl(file);
  const img = await loadImage(original);
  const maxDim = 1280;
  const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
  const w = Math.round(img.width * scale);
  const h = Math.round(img.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("no ctx");
  ctx.drawImage(img, 0, 0, w, h);
  const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
  return { base64: dataUrl.split(",")[1] ?? "", mime: "image/jpeg", dataUrl };
}

export function PlaceChat({
  tripId,
  onClose,
}: {
  tripId: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      text:
        "היי! ספר לי איזה מקומות בא לך לבקר. אפשר להקליד שמות, להעלות צילום מסך של רשימת מקומות מגוגל מפס, או להדביק קישור לריל מאינסטגרם / שורט מטיקטוק ואני אמשוך את המקומות מהתיאור. 🗺️",
    },
  ]);
  const [input, setInput] = useState("");
  const [pendingImage, setPendingImage] = useState<{ base64: string; mime: string; dataUrl: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [extracted, setExtracted] = useState<PickedPlace[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [savedNote, setSavedNote] = useState<string | null>(null);

  const fileRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  async function attachFile(file: File) {
    if (!file.type.startsWith("image/")) return;
    try {
      const img = await processImage(file);
      setPendingImage(img);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          isError: true,
          text: "לא הצלחתי לעבד את התמונה הזו (ייתכן שזה פורמט לא נתמך כמו HEIC של אייפון). נסה צילום מסך או קובץ JPG/PNG.",
        },
      ]);
    }
  }

  async function send() {
    if (loading) return;
    if (!input.trim() && !pendingImage) return;

    const userMsg: ChatMessage = {
      role: "user",
      text: input.trim(),
      imagePreview: pendingImage?.dataUrl,
    };
    const history = messages.map((m) => ({
      role: m.role === "assistant" ? ("model" as const) : ("user" as const),
      text: m.text,
    }));

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    const sentImage = pendingImage;
    setPendingImage(null);
    setLoading(true);
    setSavedNote(null);

    try {
      const res = await fetch(`/api/trips/${tripId}/place-chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          history,
          text: userMsg.text,
          imageBase64: sentImage?.base64,
          imageMime: sentImage?.mime,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        const raw: string = data.error ?? "";
        const isQuota = /quota|RESOURCE_EXHAUSTED|exceeded|rate limit|429/i.test(raw);
        let text: string;
        if (isQuota) {
          const retry = raw.match(/retry in ([\d.]+)\s*s/i);
          const secs = retry ? Math.ceil(parseFloat(retry[1])) : null;
          text =
            "⏳ חרגת ממכסת השימוש החינמית של Gemini (מוגבל לכ-15 בקשות בדקה). " +
            (secs
              ? `נסה שוב בעוד כ-${secs} שניות.`
              : "המתן כדקה ונסה שוב.") +
            "\nאם זה חוזר כל הזמן, ייתכן שמוצתה המכסה היומית — בדוק את המכסה/החיוב בחשבון ה-Gemini שלך ב-aistudio.google.com.";
        } else {
          text = `אירעה שגיאה: ${raw || "נסה שוב"}`;
        }
        setMessages((prev) => [...prev, { role: "assistant", isError: true, text }]);
      } else {
        let reply: string = data.reply ?? "";
        if (Array.isArray(data.failedLinks) && data.failedLinks.length > 0) {
          reply +=
            "\n\n⚠️ לא הצלחתי לקרוא את התיאור מחלק מהקישורים (לפעמים הפלטפורמה חוסמת). אפשר פשוט להדביק לי את הטקסט של התיאור ואחלץ ממנו את המקומות.";
        }
        setMessages((prev) => [...prev, { role: "assistant", text: reply }]);

        const newPlaces: PickedPlace[] = (data.places ?? []).map(
          (p: EnrichedPlace) => ({ ...p, cid: crypto.randomUUID() })
        );
        if (newPlaces.length > 0) {
          setExtracted((prev) => [...prev, ...newPlaces]);
          setSelected((prev) => {
            const next = new Set(prev);
            newPlaces.forEach((p) => next.add(p.cid));
            return next;
          });
        }
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", isError: true, text: "אירעה שגיאה בתקשורת. נסה שוב." },
      ]);
    }
    setLoading(false);
  }

  function toggle(cid: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(cid)) next.delete(cid);
      else next.add(cid);
      return next;
    });
  }

  async function saveSelected() {
    const toSave = extracted.filter((p) => selected.has(p.cid));
    if (toSave.length === 0) return;
    const listName = "מהצ׳אט";
    setSaving(true);
    const res = await fetch(`/api/trips/${tripId}/places/import`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        listName,
        places: toSave.map((p) => ({
          name: p.name,
          address: p.address ?? null,
          lat: p.lat ?? null,
          lng: p.lng ?? null,
          placeId: p.placeId ?? null,
          note: p.note ?? null,
          category: p.category,
        })),
      }),
    });
    setSaving(false);
    if (res.ok) {
      const savedCids = new Set(toSave.map((p) => p.cid));
      setExtracted((prev) => prev.filter((p) => !savedCids.has(p.cid)));
      setSelected((prev) => {
        const next = new Set(prev);
        savedCids.forEach((c) => next.delete(c));
        return next;
      });
      setSavedNote(`נשמרו ${toSave.length} מקומות לרשימה "${listName}" ✓`);
      router.refresh();
    }
  }

  const selectedCount = extracted.filter((p) => selected.has(p.cid)).length;

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-ink-950/40 p-4">
      <div className="flex h-[680px] max-h-[92vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-ink-100 px-4 py-3">
          <h2 className="flex items-center gap-1.5 text-sm font-bold text-ink-900">
            <Sparkles size={16} className="text-brand-600" /> צ׳אט בניית רשימת מקומות
            <span className="rounded-full bg-brand-100 px-1.5 py-0.5 text-[10px] font-bold text-brand-700">
              Gemini
            </span>
          </h2>
          <button onClick={onClose} className="rounded-lg p-1 text-ink-400 hover:bg-ink-100">
            <X size={18} />
          </button>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4 thin-scroll">
          {messages.map((m, i) => (
            <div
              key={i}
              className={cn("flex", m.role === "user" ? "justify-start" : "justify-end")}
            >
              <div
                className={cn(
                  "max-w-[85%] whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2 text-sm",
                  m.isError
                    ? "border border-rose-200 bg-rose-50 text-rose-700"
                    : m.role === "user"
                    ? "bg-brand-600 text-white"
                    : "bg-ink-100 text-ink-800"
                )}
              >
                {m.imagePreview && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={m.imagePreview}
                    alt="צורף"
                    className="mb-1.5 max-h-40 rounded-lg"
                  />
                )}
                {m.text}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-end">
              <div className="flex items-center gap-1.5 rounded-2xl bg-ink-100 px-3.5 py-2 text-sm text-ink-500">
                <Loader2 size={14} className="animate-spin" /> חושב...
              </div>
            </div>
          )}
        </div>

        {/* Extracted places tray */}
        {extracted.length > 0 && (
          <div className="border-t border-ink-100 bg-ink-50/60 px-4 py-2.5">
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-xs font-semibold text-ink-600">
                מקומות שזוהו ({extracted.length})
              </span>
              <Button size="sm" onClick={saveSelected} disabled={saving || selectedCount === 0}>
                {saving ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <Bookmark size={13} />
                )}
                הוסף {selectedCount} לרשימה
              </Button>
            </div>
            <div className="flex max-h-28 flex-wrap gap-1.5 overflow-y-auto thin-scroll">
              {extracted.map((p) => {
                const meta = SAVED_PLACE_CATEGORY_META[p.category] ?? SAVED_PLACE_CATEGORY_META.OTHER;
                const on = selected.has(p.cid);
                return (
                  <button
                    key={p.cid}
                    onClick={() => toggle(p.cid)}
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ring-1 transition-colors",
                      on
                        ? "bg-emerald-50 text-emerald-700 ring-emerald-300"
                        : "bg-white text-ink-500 ring-ink-200"
                    )}
                  >
                    {on ? <Check size={11} /> : <span className="w-[11px]" />}
                    {meta.emoji} {p.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {savedNote && (
          <div className="bg-emerald-50 px-4 py-1.5 text-center text-xs font-medium text-emerald-700">
            {savedNote}
          </div>
        )}

        {/* Composer */}
        <div className="border-t border-ink-100 px-3 py-2.5">
          {pendingImage && (
            <div className="mb-2 flex items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={pendingImage.dataUrl} alt="" className="h-12 w-12 rounded-lg object-cover" />
              <button
                onClick={() => setPendingImage(null)}
                className="text-xs text-ink-400 hover:text-rose-500"
              >
                הסר תמונה
              </button>
            </div>
          )}
          <div className="flex items-end gap-2">
            <button
              onClick={() => fileRef.current?.click()}
              className="shrink-0 rounded-lg p-2 text-ink-400 hover:bg-ink-100 hover:text-ink-700"
              title="צרף תמונה"
            >
              <ImagePlus size={18} />
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) attachFile(f);
                if (fileRef.current) fileRef.current.value = "";
              }}
            />
            <textarea
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onPaste={(e) => {
                const item = Array.from(e.clipboardData.items).find((it) =>
                  it.type.startsWith("image/")
                );
                if (item) {
                  const f = item.getAsFile();
                  if (f) attachFile(f);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder="הקלד מקומות, הדבק קישור או צרף תמונה..."
              className="max-h-24 flex-1 resize-none rounded-xl border border-ink-200 bg-white px-3 py-2 text-base sm:text-sm placeholder:text-ink-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
            <Button onClick={send} disabled={loading || (!input.trim() && !pendingImage)} className="shrink-0">
              <Send size={16} />
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
