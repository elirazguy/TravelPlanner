import type { Metadata } from "next";
import Link from "next/link";
import { Rubik, Heebo } from "next/font/google";
import { BackgroundProvider } from "@/components/background/BackgroundProvider";
import { PageTransition } from "@/components/background/PageTransition";
import { TopNav } from "@/components/TopNav";
import "./globals.css";

const rubik = Rubik({
  subsets: ["hebrew", "latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-rubik",
  display: "swap",
});

const heebo = Heebo({
  subsets: ["hebrew", "latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-heebo",
  display: "swap",
});

export const metadata: Metadata = {
  title: "TravelPlanner — Smart Travel & Itinerary Management",
  description:
    "TravelPlanner is an all-in-one travel planning platform designed to organize trip itineraries, manage flight schedules and hotel bookings, securely store travel documents, and offer AI vacation recommendations.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="he" dir="rtl" className={`${rubik.variable} ${heebo.variable}`}>
      <body className="min-h-screen font-sans">
        <BackgroundProvider>
          <TopNav />
          <main className="mx-auto max-w-7xl px-4 py-8 relative">
            <PageTransition>{children}</PageTransition>
          </main>
        </BackgroundProvider>
      </body>
    </html>
  );
}
