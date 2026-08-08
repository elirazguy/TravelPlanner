import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { Rubik, Heebo } from "next/font/google";
import { BackgroundProvider } from "@/components/background/BackgroundProvider";
import { PageTransition } from "@/components/background/PageTransition";
import { TopNav } from "@/components/TopNav";
import { getSession } from "@/lib/session";
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
  icons: {
    icon: [
      { url: "/Logo.png", type: "image/png" },
    ],
    shortcut: "/Logo.png",
    apple: "/Logo.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await getSession();

  return (
    <html lang="he" dir="rtl" className={`${rubik.variable} ${heebo.variable}`}>
      <head>
        <link rel="icon" href="/Logo.png" type="image/png" sizes="any" />
        <link rel="apple-touch-icon" href="/Logo.png" />
      </head>
      <body className="min-h-screen font-sans overflow-x-hidden">
        <BackgroundProvider>
          <TopNav initialUser={user} />
          <main className="mx-auto max-w-7xl px-2 sm:px-4 py-4 sm:py-8 relative min-w-0 max-w-full overflow-hidden">
            <PageTransition>{children}</PageTransition>
          </main>
        </BackgroundProvider>
      </body>
    </html>
  );
}
