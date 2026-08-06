"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Archive, User, Users, Home, ChevronDown, Settings as SettingsIcon } from "lucide-react";
import { useEffect, useState } from "react";

interface UserProfile {
  name?: string | null;
  email?: string | null;
  picture?: string | null;
}

export function TopNav() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [hideNav, setHideNav] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const search = new URLSearchParams(window.location.search);
      const fromParam = search.get("from");
      if (
        pathname === "/login" ||
        ((pathname === "/privacy" || pathname === "/terms") && (!user || fromParam === "home" || fromParam === "login"))
      ) {
        setHideNav(true);
        return;
      }
    }
    setHideNav(false);
  }, [pathname, user]);

  useEffect(() => {
    if (pathname === "/login" || user) return;
    fetch("/api/user")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && !data.error) {
          setUser(data);
        }
      })
      .catch(() => {});
  }, [pathname, user]);

  // Hide TopNav on login page or when accessed from login
  if (hideNav || pathname === "/login") return null;

  const displayName = user?.name || user?.email?.split("@")[0] || "משתמש";

  function handleLogoClick(e: React.MouseEvent) {
    if (window.innerWidth < 768) {
      e.preventDefault();
      setMobileMenuOpen((prev) => !prev);
    }
  }

  return (
    <header className="sticky top-0 z-30 border-b border-white/40 bg-white/60 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2.5">
        {/* Right side in RTL: Brand Logo (Toggles menu on Mobile, goes Home on Desktop) */}
        <div className="relative">
          <Link
            href="/"
            onClick={handleLogoClick}
            className="flex items-center gap-2 rounded-xl p-1 transition-colors hover:bg-white/40"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/Logo.png?v=2"
              alt="TravelPlanner"
              className="h-10 w-10 md:h-12 md:w-12 object-contain drop-shadow-sm"
            />
            <div className="leading-tight text-right">
              <div className="font-display text-base md:text-lg font-extrabold text-ink-900 flex items-center gap-1">
                <span>TravelPlanner</span>
                <ChevronDown
                  size={14}
                  className={`text-ink-400 transition-transform md:hidden ${mobileMenuOpen ? "rotate-180" : ""}`}
                />
              </div>
              <div className="-mt-0.5 text-[10px] md:text-[11px] font-medium uppercase tracking-wider text-ink-400">
                פלטפורמה חכמה לתכנון טיולים
              </div>
            </div>
          </Link>

          {/* Mobile Navigation Dropdown Menu */}
          {mobileMenuOpen && (
            <div className="absolute top-full right-0 mt-2 w-56 rounded-2xl border border-white/80 bg-white/95 p-2 shadow-xl backdrop-blur-2xl z-50 md:hidden animate-in fade-in slide-in-from-top-2">
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-semibold text-zinc-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
              >
                <Home size={16} /> הטיולים שלי
              </Link>
              <Link
                href="/community"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-semibold text-zinc-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
              >
                <Users size={16} /> קהילת מטיילים
              </Link>
              <Link
                href="/archive"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-semibold text-zinc-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
              >
                <Archive size={16} /> ארכיון טיולים
              </Link>
              <div className="my-1 border-t border-zinc-100" />
              <Link
                href="/settings"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-semibold text-zinc-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
              >
                <SettingsIcon size={16} /> הגדרות חשבון
              </Link>
            </div>
          )}
        </div>

        {/* Left side in RTL: Desktop Nav links & User profile badge */}
        <div className="flex items-center gap-3">
          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
            <Link
              href="/community"
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-ink-600 transition-colors hover:bg-white/70"
            >
              <Users size={16} /> קהילה
            </Link>
            <Link
              href="/archive"
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-ink-600 transition-colors hover:bg-white/70"
            >
              <Archive size={16} /> ארכיון
            </Link>
          </nav>

          {/* User Profile Indicator (Visible on both Mobile and Desktop) */}
          {user && (
            <Link
              href="/settings"
              className="flex items-center gap-2 rounded-full border border-white/60 bg-white/80 py-1 pr-1.5 pl-3 shadow-sm transition-all hover:bg-white hover:shadow"
              title="לעריכת הפרופיל והגדרות"
            >
              {user.picture ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.picture}
                  alt={displayName}
                  referrerPolicy="no-referrer"
                  className="h-7 w-7 rounded-full object-cover ring-2 ring-blue-500/20"
                />
              ) : (
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                  <User size={14} />
                </div>
              )}
              <span className="max-w-[85px] sm:max-w-[120px] truncate text-xs font-semibold text-zinc-800">
                {displayName}
              </span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
