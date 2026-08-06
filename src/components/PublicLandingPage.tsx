"use client";

import Link from "next/link";
import { Button } from "@/components/ui";
import {
  Compass,
  Plane,
  Hotel,
  FileText,
  Sparkles,
  ShieldCheck,
  Globe2,
  ArrowRight,
  UserCheck,
} from "lucide-react";

export function PublicLandingPage() {
  const handleGoogleLogin = () => {
    window.location.href = "/api/auth/google";
  };

  return (
    <div className="min-h-screen bg-[#fbfcfd] text-zinc-900 flex flex-col justify-between" dir="rtl">
      {/* Top Header Navigation */}
      <header className="border-b border-zinc-200/80 bg-white/80 backdrop-blur-md sticky top-0 z-40">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/Logo.png?v=2" alt="TravelPlanner Logo" className="h-10 w-10 drop-shadow-md" />
            <div>
              <span className="text-xl font-extrabold tracking-tight text-zinc-900">TravelPlanner</span>
              <span className="block text-[10px] text-blue-600 font-semibold tracking-wide dir-ltr text-right">
                Smart Travel & Itinerary Platform
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/privacy"
              className="hidden text-xs font-semibold text-zinc-600 hover:text-zinc-900 sm:inline-block"
            >
              מדיניות פרטיות
            </Link>
            <Link
              href="/terms"
              className="hidden text-xs font-semibold text-zinc-600 hover:text-zinc-900 sm:inline-block"
            >
              תנאי שימוש
            </Link>
            <Link href="/login">
              <Button variant="secondary" className="text-xs font-bold gap-1.5 rounded-xl border border-zinc-200">
                <UserCheck size={14} />
                התחברות / הרשמה
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Hero & Purpose Content */}
      <main className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 lg:px-8 flex-1 flex flex-col justify-center">
        {/* Main Badge */}
        <div className="mb-6 text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-1.5 text-xs font-bold text-blue-700 border border-blue-200 shadow-sm">
            <Sparkles size={14} className="text-amber-500" />
            TravelPlanner — פלטפורמה חכמה לתכנון וניהול טיולים
          </span>
        </div>

        {/* Hero Headline */}
        <div className="text-center max-w-3xl mx-auto mb-8">
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold text-zinc-900 tracking-tight leading-tight mb-4">
            TravelPlanner
          </h1>
          <p className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 via-teal-600 to-emerald-600 bg-clip-text text-transparent mb-4">
            כל הטיול שלך, במקום אחד חכם ומאורגן.
          </p>
          <p className="text-zinc-600 text-base sm:text-lg leading-relaxed">
            TravelPlanner היא אפליקציה מתקדמת לתכנון חופשות בינלאומיות וניהול טיולים.
            המערכת מרכזת את מסלול הטיול היומי, הזמנות המלונות והטיסות, מסמכי הנסיעה בכספת מאובטחת ועוזר AI אישי.
          </p>
        </div>

        {/* Call to Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 mb-12">
          <Button
            onClick={handleGoogleLogin}
            className="w-full sm:w-auto px-8 py-3.5 text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg transition-all flex items-center justify-center gap-3 active:scale-95"
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
            התחברות עם Google
          </Button>

          <Link href="/login" className="w-full sm:w-auto">
            <Button
              variant="secondary"
              className="w-full sm:w-auto px-8 py-3.5 text-sm font-bold border border-zinc-300 text-zinc-800 rounded-xl hover:bg-zinc-100 flex items-center justify-center gap-2"
            >
              כניסה / הרשמה באימייל
              <ArrowRight size={16} />
            </Button>
          </Link>
        </div>

        {/* English Purpose Statement Box for Google OAuth Verification */}
        <div className="max-w-2xl mx-auto rounded-2xl bg-blue-50/80 border border-blue-200/90 p-5 text-left mb-12 shadow-sm" dir="ltr">
          <div className="flex items-center gap-2 mb-2">
            <Globe2 size={16} className="text-blue-600" />
            <h3 className="text-xs font-extrabold text-blue-900 uppercase tracking-wider">About TravelPlanner</h3>
          </div>
          <p className="text-xs sm:text-sm text-zinc-700 leading-relaxed font-sans">
            TravelPlanner is a comprehensive web application designed to help users plan, organize, and manage their travel itineraries. The platform enables travelers to organize daily trip schedules, track flight and hotel bookings, securely store travel documents, and receive AI-assisted destination recommendations. When logging in with Google, TravelPlanner accesses basic profile details (name and email) strictly to authenticate users and manage their personal trips.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm hover:shadow-md transition-all">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600 font-bold">
              <Compass size={20} />
            </div>
            <h3 className="text-sm font-bold text-zinc-900 mb-1">לו"ז ומפות</h3>
            <p className="text-xs text-zinc-500 leading-relaxed">
              תכנון יומי מפורט של יעדים, אטרקציות ומפת מסלולים אינטראקטיבית.
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm hover:shadow-md transition-all">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 font-bold">
              <Plane size={20} />
            </div>
            <h3 className="text-sm font-bold text-zinc-900 mb-1">טיסות ומלונות</h3>
            <p className="text-xs text-zinc-500 leading-relaxed">
              ריכוז אישורי הזמנה ומעקב אוטומטי אחר סטטוס טיסה בזמן אמת.
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm hover:shadow-md transition-all">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600 font-bold">
              <FileText size={20} />
            </div>
            <h3 className="text-sm font-bold text-zinc-900 mb-1">כספת מסמכים</h3>
            <p className="text-xs text-zinc-500 leading-relaxed">
              אחסון מוצפן ומאובטח לדרכונים, כרטיסים, ביטוחים ואישורים.
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm hover:shadow-md transition-all">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-purple-600 font-bold">
              <Sparkles size={20} />
            </div>
            <h3 className="text-sm font-bold text-zinc-900 mb-1">יועץ AI אישי</h3>
            <p className="text-xs text-zinc-500 leading-relaxed">
              המלצות מותאמות אישית ליעד, עוזר אריזה וצ'אט תכנון אינטראקטיבי.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200 bg-white py-6">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 text-xs text-zinc-500 sm:flex-row sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <ShieldCheck size={16} className="text-emerald-600" />
            <span>TravelPlanner © 2026 • כל הזכויות שמורות</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="hover:text-zinc-900 transition-colors">
              מדיניות פרטיות
            </Link>
            <span>•</span>
            <Link href="/terms" className="hover:text-zinc-900 transition-colors">
              תנאי שימוש
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
