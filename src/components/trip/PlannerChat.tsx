"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Send, Loader2, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";
import { Markdown } from "@/components/Markdown";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  isError?: boolean;
}

export function PlannerChat({ tripId }: { tripId: string }) {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "היי! אני סוכן התכנון החכם שלך למסלול. 🗺️\nאפשר לבקש ממני להרכיב יום שלם מאפס, לחפש מקום ספציפי ולשבץ אותו, או לעשות סדר במקומות השמורים שלך.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages, loading, isOpen]);

  async function send() {
    if (loading || !input.trim()) return;

    const userMsg: ChatMessage = { role: "user", content: input.trim() };
    const history = messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(`/api/trips/${tripId}/planner`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...history, userMsg] }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `אירעה שגיאה: ${data.error || "נסה שוב"}`,
            isError: true,
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.reply || "סיימתי!" },
        ]);
        // Refresh the page to show any changes the AI made to the itinerary
        router.refresh();
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "אירעה שגיאה בתקשורת. נסה שוב.",
          isError: true,
        },
      ]);
    }

    setLoading(false);
  }

  return (
    <>
      {/* ── Universal Floating Bubble Button (Bottom Left) ────────────────── */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-5 left-5 z-50 flex items-center gap-2.5 rounded-full bg-gradient-to-r from-brand-600 via-indigo-600 to-violet-600 px-4 py-3 text-white shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95 ring-4 ring-white/90"
        title="פתח את צ'אט AI המתכנן"
      >
        <div className="relative flex items-center justify-center">
          <Sparkles size={20} className="animate-pulse text-amber-300" />
          <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-white" />
        </div>
        <span className="text-xs font-extrabold tracking-wide">המתכנן AI</span>
      </button>

      {/* ── Universal Floating Chat Modal ─────────────────────────────────── */}
      {isOpen && (
        <>
          {/* Backdrop overlay for mobile */}
          <div
            className="fixed inset-0 z-40 bg-ink-950/30 backdrop-blur-xs sm:hidden"
            onClick={() => setIsOpen(false)}
          />

          {/* Floating Chat Box */}
          <div className="fixed bottom-20 left-4 right-4 sm:right-auto sm:left-5 z-50 flex h-[500px] w-auto sm:w-[400px] max-h-[80vh] flex-col overflow-hidden rounded-3xl border border-brand-200 bg-white shadow-2xl animate-in slide-in-from-bottom-4 duration-300">
            {/* Header */}
            <div className="flex items-center justify-between bg-gradient-to-r from-brand-600 via-indigo-600 to-violet-600 px-4 py-3 text-white">
              <div className="flex items-center gap-2">
                <Sparkles size={18} className="text-amber-300 animate-pulse" />
                <h3 className="font-bold text-sm">צ'אט AI - המתכנן</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-full bg-white/20 p-1 text-white hover:bg-white/30 transition-colors"
                title="סגור חלון"
              >
                <X size={18} />
              </button>
            </div>

            {/* Messages */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-slate-50/70 thin-scroll"
            >
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex",
                    m.role === "user" ? "justify-start" : "justify-end"
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[90%] rounded-2xl px-4 py-2.5 text-sm shadow-sm",
                      m.isError
                        ? "bg-rose-50 text-rose-700 border border-rose-100"
                        : m.role === "user"
                        ? "bg-brand-600 text-white"
                        : "bg-white text-ink-900 border border-ink-100"
                    )}
                  >
                    {m.role === "assistant" && !m.isError ? (
                      <div className="prose prose-sm prose-brand max-w-none rtl:text-right">
                        <Markdown content={m.content} />
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap break-words">{m.content}</p>
                    )}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-end">
                  <div className="bg-white border border-ink-100 rounded-2xl px-4 py-3 shadow-sm flex items-center gap-2">
                    <Loader2 size={16} className="animate-spin text-brand-600" />
                    <span className="text-xs text-ink-500 font-medium">
                      חושב ועובד על המסלול...
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-3 bg-white border-t border-ink-100">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  send();
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  placeholder="איך תרצה שנעצב את המסלול היום?"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={loading}
                  className="flex-1 bg-ink-50 border-none rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-brand-500/20 focus:bg-white transition-all disabled:opacity-50"
                />
                <Button
                  type="submit"
                  disabled={!input.trim() || loading}
                  className="rounded-xl bg-brand-600 hover:bg-brand-700 shrink-0 p-2 text-white"
                >
                  <Send size={16} className="rtl:rotate-180" />
                </Button>
              </form>
            </div>
          </div>
        </>
      )}
    </>
  );
}
