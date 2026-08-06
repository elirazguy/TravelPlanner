"use client";

import { useState } from "react";
import { UserPlus, Copy, Check, Users, Link as LinkIcon, X } from "lucide-react";
import { Button, Input } from "@/components/ui";

interface ShareInviteModalProps {
  inviteCode: string;
}

export function ShareInviteModal({ inviteCode }: ShareInviteModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const inviteUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/join/${inviteCode}`
      : `/join/${inviteCode}`;

  function handleCopy() {
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  }

  return (
    <>
      <Button
        variant="secondary"
        onClick={() => setIsOpen(true)}
        className="gap-1.5 text-xs font-bold border-indigo-200 text-indigo-700 hover:bg-indigo-50 rounded-lg shadow-sm whitespace-nowrap shrink-0"
        title="שתף קישור להצטרפות ועריכה משותפת בלייב"
      >
        <UserPlus size={14} />
        <span>הזמן שותפים</span>
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" dir="rtl">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 relative">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute left-4 top-4 text-zinc-400 hover:text-zinc-700"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3 border-b border-zinc-100 pb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
                <Users size={22} />
              </div>
              <div>
                <h3 className="font-bold text-lg text-zinc-900">תכנון טיול משותף בלייב</h3>
                <p className="text-xs text-zinc-500">הזמן בני זוג, חברים או משפחה לערוך ולתכנן את הטיול יחד</p>
              </div>
            </div>

            <p className="text-xs text-zinc-600 leading-relaxed">
              שלח את הקישור לשותפים שלך (בוואטסאפ, אימייל וכו׳). לחיצה על הקישור תחבר אותם מידית לטיול, וכל שינוי שתעשו יתעדכן אצל כולכם בלייב!
            </p>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-700 flex items-center gap-1">
                <LinkIcon size={13} className="text-indigo-600" />
                קישור הצטרפות ייחודי
              </label>
              <div className="flex items-center gap-2">
                <Input
                  value={inviteUrl}
                  readOnly
                  className="bg-slate-50 text-xs text-zinc-700 font-mono"
                />
                <Button
                  onClick={handleCopy}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shrink-0 gap-1.5"
                >
                  {copied ? (
                    <>
                      <Check size={14} className="text-emerald-400" />
                      הועתק!
                    </>
                  ) : (
                    <>
                      <Copy size={14} />
                      העתק
                    </>
                  )}
                </Button>
              </div>
            </div>

            {copied && (
              <div className="rounded-xl bg-emerald-50 p-2.5 text-center text-xs font-semibold text-emerald-700 border border-emerald-100 flex items-center justify-center gap-1.5 animate-in fade-in">
                <Check size={14} />
                <span>הקישור הועתק בהצלחה ללוח! עכשיו תוכל לשלוח אותו לשותפים שלך.</span>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
