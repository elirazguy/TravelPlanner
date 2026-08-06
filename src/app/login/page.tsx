"use client";

import Link from "next/link";
import { Button, Input } from "@/components/ui";
import { useState } from "react";
import {
  Loader2,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  Compass,
  Plane,
  Hotel,
  FileText,
  Sparkles,
  ShieldCheck,
  Globe2,
} from "lucide-react";

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleLogin = () => {
    const params = new URLSearchParams();
    if (name.trim()) {
      params.append("name", name.trim());
    }
    window.location.href = `/api/auth/google?${params.toString()}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const endpoint = mode === "register" ? "/api/auth/register" : "/api/auth/login";
      const payload = mode === "register" ? { email, password, name } : { email, password };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "אירעה שגיאה. נסה שוב.");
        setLoading(false);
        return;
      }

      // Success -> Redirect to home page
      window.location.href = "/";
    } catch {
      setError("שגיאה בתקשורת עם השרת. נסה שוב.");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex bg-[#fbfcfd] text-zinc-900 overflow-y-auto" dir="rtl">
      {/* Right side: Hero & Product Presentation (Visible on desktop) */}
      <div className="hidden w-1/2 flex-col justify-between bg-gradient-to-br from-[#0a192f] via-[#0d213a] to-[#020c1b] p-10 lg:p-14 text-right lg:flex relative overflow-hidden">
        {/* Background glow effects */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

        {/* Top Header Branding */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/Logo.png?v=2" alt="TravelPlanner Logo" className="h-12 w-12 drop-shadow-xl" />
            <div>
              <span className="text-xl font-extrabold tracking-tight text-white">TravelPlanner</span>
              <span className="block text-[11px] text-blue-300 font-medium tracking-wide">
                Smart Itinerary & Voyage Platform
              </span>
            </div>
          </div>
          <span className="rounded-full bg-blue-500/10 border border-blue-400/20 px-3 py-1 text-xs font-semibold text-blue-300 flex items-center gap-1.5">
            <Globe2 size={13} className="text-blue-400" />
            מערכת חכמה לניהול טיולים
          </span>
        </div>

          {/* Hero Headline & Explanation */}
          <div className="relative z-10 my-auto max-w-xl pr-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-md px-3.5 py-1.5 text-xs font-semibold text-blue-200 border border-white/10 mb-4">
              <Sparkles size={14} className="text-yellow-400" />
              תכנון טיולים מבוסס AI, מסמכים ומפות
            </div>

            <h1 className="font-display text-4xl xl:text-5xl font-extrabold text-white leading-tight mb-3">
              TravelPlanner <br />
              <span className="bg-gradient-to-r from-blue-400 via-teal-300 to-emerald-400 bg-clip-text text-transparent">
                כל הטיול שלך במקום אחד.
              </span>
            </h1>

            <p className="text-zinc-300 text-sm xl:text-base leading-relaxed mb-6">
              TravelPlanner היא אפליקציה מתקדמת לתכנון וניהול חופשות וטיולים. 
              המערכת מרכזת את מסלול הטיול היומי, הזמנות המלונות והטיסות, מסמכי הנסיעה ועוזר AI אישי שממליץ על אטרקציות ובונה רשימות ציוד.
            </p>

            {/* Feature Grid Badges */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-start gap-3 rounded-2xl bg-white/[0.06] backdrop-blur-md p-3 border border-white/10">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-500/20 text-blue-400">
                  <Compass size={18} />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white">מסלולים ומפות</h3>
                  <p className="text-[11px] text-zinc-400 leading-tight">לו"ז יומי מפורט עם מפת יעדים אינטראקטיבית</p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-2xl bg-white/[0.06] backdrop-blur-md p-3 border border-white/10">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
                  <Plane size={18} />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white">טיסות ומלונות</h3>
                  <p className="text-[11px] text-zinc-400 leading-tight">סנכרון הזמנות ומעקב בזמן אמת</p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-2xl bg-white/[0.06] backdrop-blur-md p-3 border border-white/10">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400">
                  <FileText size={18} />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white">כספת מסמכים</h3>
                  <p className="text-[11px] text-zinc-400 leading-tight">אחסון מאובטח לדרכונים, כרטיסים ואישורים</p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-2xl bg-white/[0.06] backdrop-blur-md p-3 border border-white/10">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-500/20 text-purple-400">
                  <Sparkles size={18} />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white">עוזר AI אישי</h3>
                  <p className="text-[11px] text-zinc-400 leading-tight">המלצות מותאמות אישית וייעוץ מסלולים</p>
                </div>
              </div>
            </div>

            {/* Explicit App Purpose Box for Google OAuth Verification */}
            <div className="mt-5 rounded-2xl bg-blue-500/10 border border-blue-400/20 p-3.5 text-left" dir="ltr">
              <h4 className="text-xs font-bold text-blue-300 mb-1">About TravelPlanner</h4>
              <p className="text-[11px] text-zinc-300 leading-relaxed">
                TravelPlanner is an all-in-one travel planning application designed to help users organize daily trip itineraries, track flight & hotel bookings, securely store travel documents, and receive AI-assisted vacation recommendations.
              </p>
            </div>
          </div>

        {/* Footer info & Security assurance */}
        <div className="relative z-10 flex items-center justify-between border-t border-white/10 pt-4 text-xs text-zinc-400">
          <span className="flex items-center gap-1.5">
            <ShieldCheck size={16} className="text-emerald-400" />
            התחברות מאובטחת ושמירה מלאה על פרטיות הנתונים
          </span>
          <div className="flex items-center gap-4 text-zinc-400">
            <Link href="/privacy?from=login" className="hover:text-white transition-colors">
              מדיניות פרטיות
            </Link>
            <span>•</span>
            <Link href="/terms?from=login" className="hover:text-white transition-colors">
              תנאי שימוש
            </Link>
          </div>
        </div>
      </div>

      {/* Left side: Form & Mobile Hero Explanation */}
      <div className="flex w-full flex-col justify-center px-6 py-10 lg:w-1/2 xl:px-20 bg-gradient-to-br from-[#fcfdfd] to-[#f4f7f9]">
        <div className="mx-auto w-full max-w-md">
          {/* Mobile Logo & Hero Intro */}
          <div className="mb-6 text-center lg:hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/Logo.png?v=2" alt="TravelPlanner Logo" className="h-16 w-16 mx-auto mb-3 drop-shadow-md" />
            <h1 className="text-2xl font-extrabold text-zinc-900">TravelPlanner</h1>
            <p className="text-xs text-zinc-600 mt-1 max-w-xs mx-auto">
              מערכת חכמה לתכנון טיולים, ניהול מסלולים, מלונות, טיסות ומסמכים
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="mb-6 flex rounded-2xl bg-zinc-200/60 p-1.5 backdrop-blur-sm">
            <button
              type="button"
              onClick={() => { setMode("login"); setError(null); }}
              className={`flex-1 rounded-xl py-2.5 text-sm font-bold transition-all ${
                mode === "login"
                  ? "bg-white text-zinc-900 shadow-md"
                  : "text-zinc-500 hover:text-zinc-800"
              }`}
            >
              התחברות
            </button>
            <button
              type="button"
              onClick={() => { setMode("register"); setError(null); }}
              className={`flex-1 rounded-xl py-2.5 text-sm font-bold transition-all ${
                mode === "register"
                  ? "bg-white text-zinc-900 shadow-md"
                  : "text-zinc-500 hover:text-zinc-800"
              }`}
            >
              יצירת חשבון חדש
            </button>
          </div>

          <h2 className="mb-1 text-2xl sm:text-3xl font-extrabold text-zinc-900">
            {mode === "login" ? "התחברות לחשבון" : "יצירת חשבון חדש"}
          </h2>
          <p className="mb-6 text-sm text-zinc-500">
            {mode === "login"
              ? "הכנס את האימייל והסיסמה שלך כדי להיכנס למערכת"
              : "מלא את הפרטים כדי לפתוח חשבון בחינם"}
          </p>

          {/* Error alert */}
          {error && (
            <div className="mb-5 rounded-xl border border-rose-200 bg-rose-50/90 p-3 text-xs font-semibold text-rose-700 animate-in fade-in zoom-in-95">
              {error}
            </div>
          )}

          {/* Email / Password Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-700">שם מלא</label>
                <div className="relative">
                  <User size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <Input
                    type="text"
                    required
                    placeholder="ישראל ישראלי"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pr-10 bg-white"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-700">כתובת אימייל</label>
              <div className="relative">
                <Mail size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                <Input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pr-10 bg-white text-right dir-ltr"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-700">סיסמה</label>
              <div className="relative">
                <Lock size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                <Input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-10 pl-10 bg-white text-right dir-ltr"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full py-3 text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md transition-all active:scale-[0.99]"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 size={16} className="animate-spin" />
                  {mode === "login" ? "מתחבר..." : "יוצר חשבון..."}
                </span>
              ) : mode === "login" ? (
                "התחבר"
              ) : (
                "צור חשבון"
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-6 flex items-center justify-center">
            <div className="w-full border-t border-zinc-200" />
            <span className="absolute bg-[#fcfdfd] px-3 text-xs font-medium text-zinc-400">
              או
            </span>
          </div>

          {/* Google OAuth Button */}
          <Button
            onClick={handleGoogleLogin}
            type="button"
            className="flex w-full items-center justify-center gap-3 rounded-xl bg-white border border-zinc-200 py-3 text-sm font-bold text-zinc-700 shadow-sm transition-all hover:bg-zinc-50 active:scale-[0.98]"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            המשך עם Google
          </Button>

          {/* Footer Terms */}
          <div className="mt-8 text-center text-xs text-zinc-500">
            בהתחברותך, אתה מסכים ל
            <Link href="/terms?from=login" className="text-blue-600 font-semibold hover:underline">
              תנאי השימוש
            </Link>{" "}
            ו
            <Link href="/privacy?from=login" className="text-blue-600 font-semibold hover:underline">
              מדיניות הפרטיות
            </Link>{" "}
            שלנו.
          </div>
        </div>
      </div>
    </div>
  );
}

