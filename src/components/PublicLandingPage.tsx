"use client";

import Link from "next/link";
import { Button, Input } from "@/components/ui";
import { useState } from "react";
import {
  Compass,
  Plane,
  FileText,
  Sparkles,
  ShieldCheck,
  Globe2,
  Loader2,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  UserCheck,
} from "lucide-react";

export function PublicLandingPage() {
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

      window.location.href = "/";
    } catch {
      setError("שגיאה בתקשורת עם השרת. נסה שוב.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fbfcfd] text-zinc-900 flex flex-col justify-between" dir="rtl">
      {/* Navigation Header */}
      <header className="border-b border-zinc-200/80 bg-white/80 backdrop-blur-md sticky top-0 z-40">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/Logo.png?v=3" alt="TravelPlanner Logo" className="h-10 w-10 drop-shadow-md rounded-lg object-contain" />
            <div>
              <span className="text-xl font-extrabold tracking-tight text-zinc-900">TravelPlanner</span>
              <span className="block text-[10px] text-blue-600 font-semibold tracking-wide dir-ltr text-right">
                Smart Travel & Itinerary Platform
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/privacy?from=home"
              className="hidden text-xs font-semibold text-zinc-600 hover:text-zinc-900 sm:inline-block"
            >
              מדיניות פרטיות
            </Link>
            <Link
              href="/terms?from=home"
              className="hidden text-xs font-semibold text-zinc-600 hover:text-zinc-900 sm:inline-block"
            >
              תנאי שימוש
            </Link>
          </div>
        </div>
      </header>

      {/* Main Grid: Hero Info + Integrated Login/Register Form */}
      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8 flex-1 flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Right Column: Hero Headline, Purpose & Features */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-1.5 text-xs font-bold text-blue-700 border border-blue-200 shadow-sm">
              <Sparkles size={14} className="text-amber-500" />
              TravelPlanner — פלטפורמה חכמה לתכנון וניהול טיולים
            </div>

            <div>
              <h1 className="font-display text-4xl sm:text-5xl font-extrabold text-zinc-900 tracking-tight leading-tight mb-2">
                TravelPlanner
              </h1>
              <p className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 via-teal-600 to-emerald-600 bg-clip-text text-transparent mb-3">
                כל הטיול שלך, במקום אחד חכם ומאורגן.
              </p>
              <p className="text-zinc-600 text-sm sm:text-base leading-relaxed">
                TravelPlanner היא אפליקציה מתקדמת לתכנון חופשות בינלאומיות וניהול טיולים. המערכת מרכזת את מסלול הטיול היומי, הזמנות המלונות והטיסות, מסמכי הנסיעה בכספת מאובטחת ועוזר AI אישי.
              </p>
            </div>

            {/* Feature Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex items-start gap-3 rounded-xl border border-zinc-200/80 bg-white p-3.5 shadow-sm">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                  <Compass size={18} />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-zinc-900">לו"ז ומפות</h3>
                  <p className="text-[11px] text-zinc-500 leading-tight">תכנון יומי מפורט ומפת יעדים אינטראקטיבית</p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-xl border border-zinc-200/80 bg-white p-3.5 shadow-sm">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                  <Plane size={18} />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-zinc-900">טיסות ומלונות</h3>
                  <p className="text-[11px] text-zinc-500 leading-tight">ריכוז הזמנות ומעקב בזמן אמת</p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-xl border border-zinc-200/80 bg-white p-3.5 shadow-sm">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
                  <FileText size={18} />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-zinc-900">כספת מסמכים</h3>
                  <p className="text-[11px] text-zinc-500 leading-tight">אחסון מוצפן לדרכונים וכרטיסים</p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-xl border border-zinc-200/80 bg-white p-3.5 shadow-sm">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-purple-100 text-purple-600">
                  <Sparkles size={18} />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-zinc-900">יועץ AI אישי</h3>
                  <p className="text-[11px] text-zinc-500 leading-tight">המלצות מותאמות אישית ועוזר אריזה</p>
                </div>
              </div>
            </div>

            {/* Explicit Purpose Statement Box for Google OAuth Verification */}
            <div className="rounded-xl bg-blue-50/80 border border-blue-200/90 p-4 text-left shadow-sm" dir="ltr">
              <div className="flex items-center gap-2 mb-1.5">
                <Globe2 size={15} className="text-blue-600" />
                <h3 className="text-[11px] font-extrabold text-blue-900 uppercase tracking-wider">About TravelPlanner</h3>
              </div>
              <p className="text-xs text-zinc-700 leading-relaxed font-sans">
                TravelPlanner is a comprehensive web application designed to help users plan, organize, and manage their travel itineraries. The platform enables travelers to organize daily trip schedules, track flight and hotel bookings, securely store travel documents, and receive AI-assisted vacation recommendations. When logging in with Google, TravelPlanner accesses basic profile details (name and email) strictly to authenticate users and manage their personal trips.
              </p>
            </div>
          </div>

          {/* Left Column: Seamless Login & Registration Card */}
          <div className="lg:col-span-5">
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl relative">
              <div className="text-center mb-6">
                <h2 className="text-xl font-extrabold text-zinc-900">
                  {mode === "login" ? "ברוכים הבאים ל-TravelPlanner" : "הרשמה ל-TravelPlanner"}
                </h2>
                <p className="text-xs text-zinc-500 mt-1">
                  {mode === "login"
                    ? "התחבר כדי לגשת למסלולים ולמסמכים שלך"
                    : "צור חשבון חדש והתחל לתכנן טיולים בחכמה"}
                </p>
              </div>

              {/* Google OAuth Login Button */}
              <Button
                type="button"
                onClick={handleGoogleLogin}
                className="w-full py-3 text-sm font-bold bg-white hover:bg-zinc-50 text-zinc-800 border border-zinc-300 rounded-xl shadow-sm transition-all flex items-center justify-center gap-3 mb-5"
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

              <div className="relative my-4 text-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-zinc-200" />
                </div>
                <span className="relative bg-white px-3 text-[11px] font-medium text-zinc-400">
                  או באמצעות אימייל
                </span>
              </div>

              {error && (
                <div className="mb-4 rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-600 border border-red-200">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-3.5">
                {mode === "register" && (
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1">שם מלא</label>
                    <div className="relative">
                      <User size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                      <Input
                        type="text"
                        placeholder="ישראל ישראלי"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        className="pr-9 text-xs rounded-xl"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">כתובת אימייל</label>
                  <div className="relative">
                    <Mail size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <Input
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="pr-9 text-xs rounded-xl"
                      dir="ltr"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">סיסמה</label>
                  <div className="relative">
                    <Lock size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="pr-9 pl-9 text-xs rounded-xl"
                      dir="ltr"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md transition-all flex items-center justify-center gap-2 mt-4"
                >
                  {loading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : mode === "login" ? (
                    "התחברות"
                  ) : (
                    "יצירת חשבון"
                  )}
                </Button>
              </form>

              <div className="mt-5 text-center text-xs text-zinc-500 border-t border-zinc-100 pt-4">
                {mode === "login" ? (
                  <>
                    אין לך חשבון עדיין?{" "}
                    <button
                      type="button"
                      onClick={() => {
                        setMode("register");
                        setError(null);
                      }}
                      className="font-bold text-blue-600 hover:underline"
                    >
                      להרשמה מהירה
                    </button>
                  </>
                ) : (
                  <>
                    כבר יש לך חשבון?{" "}
                    <button
                      type="button"
                      onClick={() => {
                        setMode("login");
                        setError(null);
                      }}
                      className="font-bold text-blue-600 hover:underline"
                    >
                      להתחברות
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200 bg-white py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-center px-4 text-xs text-zinc-500">
          <div className="flex items-center justify-center gap-2">
            <ShieldCheck size={16} className="text-emerald-600" />
            <span>TravelPlanner © 2026 • כל הזכויות שמורות</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
