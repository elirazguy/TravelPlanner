"use client";

import { useState } from "react";
import {
  Plus,
  Trash2,
  Loader2,
  Settings as SettingsIcon,
  Package,
  UserCircle,
  ShieldAlert,
  LogOut,
  Mail,
  MessageSquare,
  Send,
  CheckCircle2,
  Lightbulb,
  HelpCircle,
} from "lucide-react";
import { Button, Card, Input, Label, Textarea } from "@/components/ui";
import { SetBackground } from "@/components/background/BackgroundProvider";
import type { PackingItemDTO } from "@/lib/types";

interface UserProfile {
  id: string;
  name: string | null;
  email: string | null;
  picture: string | null;
}

export function SettingsClient({
  initialUser,
  initialItems,
}: {
  initialUser: UserProfile;
  initialItems: PackingItemDTO[];
}) {
  // User Profile
  const [user, setUser] = useState<UserProfile>(initialUser);
  const [nameInput, setNameInput] = useState(initialUser.name || "");
  const [pictureInput, setPictureInput] = useState(initialUser.picture || "");
  const [savingProfile, setSavingProfile] = useState(false);
  const [isEditingPicture, setIsEditingPicture] = useState(false);

  // Packing List
  const [items, setItems] = useState<PackingItemDTO[]>(initialItems);
  const [newText, setNewText] = useState("");
  const [adding, setAdding] = useState(false);

  // General loading state
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  // Support & Feedback state
  const [feedbackType, setFeedbackType] = useState<"support" | "suggestion">("support");
  const [feedbackSubject, setFeedbackSubject] = useState("");
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [feedbackSent, setFeedbackSent] = useState(false);

  async function updateProfile(newPicture?: string) {
    const picToSave = newPicture !== undefined ? newPicture : pictureInput;
    if (!nameInput.trim()) return;
    setSavingProfile(true);
    const res = await fetch("/api/user", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: nameInput.trim(), picture: picToSave }),
    });
    if (res.ok) {
      setUser((prev) => ({ ...prev, name: nameInput.trim(), picture: picToSave }));
      setIsEditingPicture(false);
    }
    setSavingProfile(false);
  }

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("גודל התמונה מוגבל ל-2MB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setPictureInput(base64String);
      updateProfile(base64String);
    };
    reader.readAsDataURL(file);
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  async function deleteAccount() {
    if (
      !window.confirm(
        "האם אתה בטוח שברצונך למחוק את החשבון? פעולה זו תמחק לצמיתות את כל הטיולים, הפריטים והנתונים שלך. לא ניתן לבטל פעולה זו."
      )
    ) {
      return;
    }
    setIsDeletingAccount(true);
    const res = await fetch("/api/user", { method: "DELETE" });
    if (res.ok) {
      window.location.href = "/login";
    } else {
      alert("שגיאה במחיקת החשבון");
      setIsDeletingAccount(false);
    }
  }

  async function addItem() {
    if (!newText.trim()) return;
    setAdding(true);
    const res = await fetch("/api/settings/packing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: newText.trim() }),
    });
    if (res.ok) {
      const item = await res.json();
      setItems((prev) => [...prev, item]);
      setNewText("");
    }
    setAdding(false);
  }

  async function removeItem(id: string) {
    await fetch(`/api/settings/packing/${id}`, { method: "DELETE" });
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  function handleSendFeedback(e: React.FormEvent) {
    e.preventDefault();
    if (!feedbackMessage.trim()) return;

    const topicText = feedbackType === "support" ? "פנייה לתמיכה" : "הצעת ייעול";
    const subject = encodeURIComponent(
      `[${topicText}] ${feedbackSubject.trim() || "ללא נושא"} - תכנון טיולים חכם`
    );
    const body = encodeURIComponent(
      `שלום,\n\nסוג הפנייה: ${topicText}\nמשתמש: ${user.name || "אנונימי"} (${
        user.email || "ללא אימייל"
      })\n\nהודעה:\n${feedbackMessage.trim()}\n\n---\nנשלח מאפליקציית תכנון טיולים חכם`
    );

    window.location.href = `mailto:eliraz.guy@gmail.com?subject=${subject}&body=${body}`;
    setFeedbackSent(true);
    setFeedbackSubject("");
    setFeedbackMessage("");
    setTimeout(() => setFeedbackSent(false), 4000);
  }

  return (
    <>
      <SetBackground name="settings" />
      <div className="mx-auto max-w-2xl space-y-8 pb-12">
        {/* Page header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-slate-500 to-zinc-600 text-white shadow-md">
              <SettingsIcon size={20} />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-ink-900">הגדרות חשבון</h1>
              <p className="text-sm text-ink-500">ניהול פרטים אישיים, ציוד קבוע והעדפות</p>
            </div>
          </div>
          <Button
            variant="secondary"
            className="text-zinc-600 border-zinc-200"
            onClick={handleLogout}
          >
            <LogOut size={16} className="ml-2" />
            התנתק
          </Button>
        </div>

        {/* Profile Section */}
        <Card className="p-6">
          <div className="mb-4 flex items-center gap-2 border-b border-zinc-100 pb-3">
            <UserCircle size={20} className="text-blue-500" />
            <h2 className="text-lg font-bold text-ink-900">פרופיל אישי</h2>
          </div>

          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            {/* Profile Picture */}
            <div className="flex flex-col items-center gap-3">
              <div className="relative group h-24 w-24 overflow-hidden rounded-full border-4 border-white shadow-lg bg-zinc-100 flex items-center justify-center">
                {user.picture ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={user.picture}
                    alt="Profile"
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <UserCircle size={48} className="text-zinc-300" />
                )}

                <label
                  htmlFor="profile-upload"
                  className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-[11px] font-medium"
                >
                  <span>שנה תמונה</span>
                </label>
              </div>

              <div className="flex flex-col items-center gap-1">
                <label
                  htmlFor="profile-upload"
                  className="cursor-pointer text-xs font-semibold text-blue-600 hover:underline"
                >
                  העלה תמונה חדשה
                </label>
                <input
                  id="profile-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => setIsEditingPicture(!isEditingPicture)}
                  className="text-[11px] text-zinc-400 hover:text-zinc-600"
                >
                  {isEditingPicture ? "ביטול קישור" : "או הדבק קישור לתמונה"}
                </button>
              </div>
            </div>

            {/* Profile Form */}
            <div className="flex-1 space-y-4">
              <div>
                <Label>כתובת אימייל</Label>
                <Input
                  value={user.email || ""}
                  disabled
                  className="bg-zinc-50 text-zinc-500 dir-ltr text-right"
                />
                <p className="mt-1 text-xs text-zinc-400">
                  כתובת האימייל משמשת לסנכרון מ-Booking.com
                </p>
              </div>

              <div>
                <Label>שם תצוגה</Label>
                <div className="flex gap-2">
                  <Input
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    placeholder="הכנס שם תצוגה..."
                  />
                  <Button
                    onClick={() => updateProfile()}
                    disabled={
                      savingProfile ||
                      (nameInput === user.name && pictureInput === user.picture)
                    }
                  >
                    {savingProfile ? <Loader2 size={16} className="animate-spin" /> : "שמור"}
                  </Button>
                </div>
              </div>

              {isEditingPicture && (
                <div className="rounded-lg bg-zinc-50 p-3 border border-zinc-200 space-y-2">
                  <Label className="text-xs">קישור (URL) לתמונה</Label>
                  <div className="flex gap-2">
                    <Input
                      value={pictureInput}
                      onChange={(e) => setPictureInput(e.target.value)}
                      placeholder="https://example.com/avatar.jpg"
                      className="text-xs dir-ltr text-right"
                    />
                    <Button
                      size="sm"
                      onClick={() => updateProfile(pictureInput)}
                      disabled={savingProfile}
                    >
                      עדכן תמונה
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Permanent packing list */}
        <Card className="p-6">
          <div className="mb-2 flex items-center gap-2 border-b border-zinc-100 pb-3">
            <Package size={20} className="text-emerald-500" />
            <h2 className="text-lg font-bold text-ink-900">רשימת ציוד קבועה</h2>
          </div>
          <p className="mb-6 text-sm text-ink-500">
            פריטים אלו יתווספו אוטומטית לכל טיול חדש שתיצור, מומלץ עבור ציוד חובה כמו דרכון, כסף, מטען וכו'.
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              addItem();
            }}
            className="mb-6 flex gap-2"
          >
            <Input
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              placeholder="לדוגמה: מטען לטלפון..."
              className="flex-1"
            />
            <Button
              type="submit"
              disabled={!newText.trim() || adding}
              className="shrink-0 gap-2"
            >
              {adding ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
              הוסף
            </Button>
          </form>

          <div className="space-y-2">
            {items.length === 0 ? (
              <div className="rounded-lg border border-dashed border-zinc-200 py-8 text-center text-zinc-500">
                אין פריטים קבועים עדיין.
              </div>
            ) : (
              items.map((item, idx) => (
                <div
                  key={item.id || `item-${idx}`}
                  className="group flex items-center justify-between rounded-xl border border-zinc-100 bg-white p-3 shadow-sm transition-all hover:border-zinc-200"
                >
                  <span className="font-medium text-zinc-800">{item.text}</span>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="rounded p-2 text-zinc-300 opacity-0 transition hover:bg-red-50 hover:text-red-600 group-hover:opacity-100"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Support & Feedback Section */}
        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between border-b border-zinc-100 pb-3">
            <div className="flex items-center gap-2">
              <MessageSquare size={20} className="text-violet-500" />
              <h2 className="text-lg font-bold text-ink-900">תמיכה והצעות ייעול</h2>
            </div>
            <a
              href="mailto:eliraz.guy@gmail.com"
              className="text-xs font-semibold text-violet-600 hover:underline flex items-center gap-1"
            >
              <Mail size={13} /> eliraz.guy@gmail.com
            </a>
          </div>

          <p className="mb-6 text-sm text-ink-500">
            יש לך שאלה, נתקלת בבעיה או שיש לך רעיון מעולה לשפור האפליקציה? נשמח לשמוע ממך!
          </p>

          <form onSubmit={handleSendFeedback} className="space-y-4">
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setFeedbackType("support")}
                className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 px-4 text-xs font-bold transition-all border ${
                  feedbackType === "support"
                    ? "bg-violet-50 border-violet-300 text-violet-700 shadow-sm"
                    : "bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50"
                }`}
              >
                <HelpCircle size={15} /> פנייה לתמיכה
              </button>
              <button
                type="button"
                onClick={() => setFeedbackType("suggestion")}
                className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 px-4 text-xs font-bold transition-all border ${
                  feedbackType === "suggestion"
                    ? "bg-amber-50 border-amber-300 text-amber-700 shadow-sm"
                    : "bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50"
                }`}
              >
                <Lightbulb size={15} /> הצעת ייעול / רעיון
              </button>
            </div>

            <div>
              <Label>נושא</Label>
              <Input
                value={feedbackSubject}
                onChange={(e) => setFeedbackSubject(e.target.value)}
                placeholder={
                  feedbackType === "support"
                    ? "תקלה בטעינת המפה..."
                    : "רעיון לשילוב תחזית מזג אוויר..."
                }
              />
            </div>

            <div>
              <Label>תוכן ההודעה</Label>
              <Textarea
                rows={4}
                value={feedbackMessage}
                onChange={(e) => setFeedbackMessage(e.target.value)}
                placeholder={
                  feedbackType === "support"
                    ? "פרט כאן את הבעיה שנתקלת בה..."
                    : "שתף אותנו ברעיון שלך..."
                }
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              {feedbackSent ? (
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                  <CheckCircle2 size={16} /> חלון הדוא"ל שלך נפתח לשליחה!
                </div>
              ) : (
                <span className="text-xs text-zinc-400">
                  ההודעה תיפתח בתוכנת הדוא"ל שלך ותישלח ישירות אלינו
                </span>
              )}

              <Button
                type="submit"
                disabled={!feedbackMessage.trim()}
                className={`gap-2 text-xs font-bold ${
                  feedbackType === "support"
                    ? "bg-violet-600 hover:bg-violet-700"
                    : "bg-amber-600 hover:bg-amber-700"
                }`}
              >
                <Send size={14} />
                {feedbackType === "support" ? "שלח פנייה לתמיכה" : "שלח הצעת ייעול"}
              </Button>
            </div>
          </form>
        </Card>

        {/* Danger Zone */}
        <Card className="border-red-100 p-6">
          <div className="mb-4 flex items-center gap-2 border-b border-red-100 pb-3">
            <ShieldAlert size={20} className="text-red-500" />
            <h2 className="text-lg font-bold text-red-600">אזור סכנה - מחיקת חשבון</h2>
          </div>
          <p className="mb-4 text-sm text-zinc-600">
            מחיקת החשבון תסיר לצמיתות את המשתמש שלך, את כל הטיולים שתכננת ואת כל רשימות הציוד. לא ניתן לשחזר את הנתונים לאחר המחיקה.
          </p>
          <Button
            variant="secondary"
            onClick={deleteAccount}
            disabled={isDeletingAccount}
            className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 w-full sm:w-auto"
          >
            {isDeletingAccount ? (
              <Loader2 size={16} className="mr-2 animate-spin" />
            ) : (
              <Trash2 size={16} className="ml-2" />
            )}
            מחק את החשבון שלי לחלוטין
          </Button>
        </Card>

        {/* Footer Links */}
        <div className="text-center mt-8 space-x-4 space-x-reverse text-sm text-zinc-500">
          <a
            href="/terms?from=settings"
            className="hover:text-zinc-700 underline underline-offset-4"
          >
            תנאי שימוש
          </a>
          <span>•</span>
          <a
            href="/privacy?from=settings"
            className="hover:text-zinc-700 underline underline-offset-4"
          >
            מדיניות פרטיות
          </a>
        </div>
      </div>
    </>
  );
}
