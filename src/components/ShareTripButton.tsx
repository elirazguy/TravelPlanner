"use client";

import { useState } from "react";
import { Share2, Lock, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui";

interface ShareTripButtonProps {
  tripId: string;
  initialIsPublic: boolean;
}

export function ShareTripButton({ tripId, initialIsPublic }: ShareTripButtonProps) {
  const [isPublic, setIsPublic] = useState(initialIsPublic);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  async function toggleShare() {
    setLoading(true);
    const nextState = !isPublic;

    try {
      const res = await fetch(`/api/trips/${tripId}/share`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublic: nextState }),
      });

      if (res.ok) {
        setIsPublic(nextState);
        const msg = nextState ? "הטיול שותף בהצלחה לקהילה!" : "השיתוף בוטל והטיול חזר להיות פרטי";
        setToast(msg);
        setTimeout(() => setToast(null), 3000);
      } else {
        alert("שגיאה בעדכון סטטוס השיתוף");
      }
    } catch {
      alert("שגיאה בעדכון סטטוס השיתוף");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative inline-block">
      <Button
        variant={isPublic ? "primary" : "secondary"}
        onClick={toggleShare}
        disabled={loading}
        className={`gap-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap shrink-0 ${
          isPublic
            ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
            : "border-zinc-200 text-zinc-700 hover:bg-zinc-50"
        }`}
        title={isPublic ? "לחץ לביטול השיתוף בקהילה" : "לחץ לשיתוף הטיול בקהילה"}
      >
        {loading ? (
          <Loader2 size={14} className="animate-spin" />
        ) : isPublic ? (
          <>
            <Share2 size={14} />
            <span>משותף בקהילה</span>
          </>
        ) : (
          <>
            <Lock size={14} />
            <span>שתף לקהילה</span>
          </>
        )}
      </Button>

      {toast && (
        <div className="absolute top-full right-0 mt-2 z-20 flex items-center gap-1.5 whitespace-nowrap rounded-lg bg-zinc-900 px-3 py-1.5 text-xs text-white shadow-lg animate-in fade-in slide-in-from-top-1">
          <Check size={14} className="text-emerald-400" />
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
}
