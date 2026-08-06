"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { AnimatePresence, motion } from "framer-motion";

// Each page/tab maps to a distinct generated background scene.
export type BgKey =
  | "home"
  | "community"
  | "archive"
  | "itinerary"
  | "map"
  | "logistics"
  | "documents"
  | "consult"
  | "settings";

interface Scene {
  image: string;
  // Base gradient mesh — always rendered, doubles as a graceful fallback if the
  // generated image hasn't been fetched yet.
  base: string;
  // Soft floating colour blobs that give each scene life.
  blobs: string[];
}

const SCENES: Record<BgKey, Scene> = {
  home: {
    image: "/backgrounds/home.png",
    base: "bg-gradient-to-br from-sky-100 via-brand-50 to-indigo-100",
    blobs: [
      "bg-brand-300/40 top-[-6rem] right-[-4rem] h-80 w-80",
      "bg-sky-300/40 bottom-[-5rem] left-[10%] h-72 w-72",
      "bg-indigo-300/30 top-[20%] left-[-4rem] h-64 w-64",
    ],
  },
  community: {
    image: "/backgrounds/community.png",
    base: "bg-gradient-to-br from-blue-100 via-indigo-50 to-slate-100",
    blobs: [
      "bg-blue-300/40 top-[-6rem] right-[5%] h-96 w-96",
      "bg-indigo-300/30 bottom-[-5rem] left-[-3rem] h-80 w-80",
      "bg-cyan-300/30 top-[30%] left-[20%] h-64 w-64",
    ],
  },
  archive: {
    image: "/backgrounds/archive.png",
    base: "bg-gradient-to-br from-amber-100 via-orange-50 to-rose-100",
    blobs: [
      "bg-amber-300/40 top-[-5rem] right-[8%] h-80 w-80",
      "bg-rose-300/30 bottom-[-6rem] left-[-3rem] h-72 w-72",
      "bg-orange-300/30 top-[30%] left-[20%] h-56 w-56",
    ],
  },
  itinerary: {
    image: "/backgrounds/itinerary.png",
    base: "bg-gradient-to-br from-sky-100 via-cyan-50 to-emerald-100",
    blobs: [
      "bg-sky-300/40 top-[-6rem] left-[-3rem] h-80 w-80",
      "bg-emerald-300/30 bottom-[-5rem] right-[5%] h-72 w-72",
      "bg-cyan-300/30 top-[25%] right-[25%] h-56 w-56",
    ],
  },
  map: {
    image: "/backgrounds/map.png",
    base: "bg-gradient-to-br from-sky-200 via-sky-50 to-blue-100",
    blobs: [
      "bg-sky-300/50 top-[-6rem] right-[-3rem] h-96 w-96",
      "bg-blue-300/30 bottom-[-6rem] left-[8%] h-72 w-72",
      "bg-cyan-200/40 top-[35%] left-[-4rem] h-56 w-56",
    ],
  },
  logistics: {
    image: "/backgrounds/logistics.png",
    base: "bg-gradient-to-br from-orange-100 via-amber-50 to-rose-100",
    blobs: [
      "bg-orange-300/40 top-[-5rem] left-[10%] h-80 w-80",
      "bg-rose-300/40 bottom-[-6rem] right-[-3rem] h-80 w-80",
      "bg-amber-300/30 top-[30%] right-[20%] h-56 w-56",
    ],
  },
  documents: {
    image: "/backgrounds/documents.png",
    base: "bg-gradient-to-br from-blue-100 via-slate-50 to-sky-100",
    blobs: [
      "bg-blue-300/40 top-[-6rem] right-[6%] h-80 w-80",
      "bg-sky-300/30 bottom-[-5rem] left-[-3rem] h-72 w-72",
      "bg-indigo-200/30 top-[25%] left-[25%] h-56 w-56",
    ],
  },
  consult: {
    image: "/backgrounds/consult.png",
    base: "bg-gradient-to-br from-violet-100 via-fuchsia-50 to-indigo-100",
    blobs: [
      "bg-violet-300/40 top-[-6rem] left-[-3rem] h-80 w-80",
      "bg-fuchsia-300/30 bottom-[-6rem] right-[8%] h-72 w-72",
      "bg-indigo-300/30 top-[30%] right-[25%] h-56 w-56",
    ],
  },
  settings: {
    image: "",
    base: "bg-gradient-to-br from-slate-100 via-zinc-50 to-stone-100",
    blobs: [
      "bg-slate-300/30 top-[-5rem] right-[10%] h-72 w-72",
      "bg-zinc-300/25 bottom-[-4rem] left-[-2rem] h-64 w-64",
      "bg-stone-200/30 top-[30%] right-[-3rem] h-48 w-48",
    ],
  },
};

const BackgroundContext = createContext<(key: BgKey) => void>(() => {});

export function useSetBackground() {
  return useContext(BackgroundContext);
}

export function BackgroundProvider({
  children,
  initial = "home",
}: {
  children: ReactNode;
  initial?: BgKey;
}) {
  const [bg, setBg] = useState<BgKey>(initial);
  const scene = SCENES[bg];

  return (
    <BackgroundContext.Provider value={setBg}>
      {/* Fixed animated background layer behind all content */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <AnimatePresence>
          <motion.div
            key={bg}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
            className={`absolute inset-0 ${scene.base}`}
          >
            {/* Floating colour blobs */}
            {scene.blobs.map((b, i) => (
              <span
                key={i}
                className={`absolute rounded-full blur-3xl animate-float ${b}`}
                style={{ animationDelay: `${i * 1.5}s` }}
              />
            ))}
            {/* Generated scene image, layered on top when available.
                If the file isn't present yet it simply renders nothing and the
                gradient mesh above remains visible. */}
            <div
              className="absolute inset-0 bg-cover bg-center bg-no-repeat"
              style={{ backgroundImage: `url(${scene.image})` }}
            />
          </motion.div>
        </AnimatePresence>
        {/* Readability scrim — fades toward solid where the content sits */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/55 via-white/75 to-white/90" />
      </div>
      {children}
    </BackgroundContext.Provider>
  );
}

// Drop-in marker used by server-rendered pages to set their background scene.
export function SetBackground({ name }: { name: BgKey }) {
  const set = useSetBackground();
  useEffect(() => {
    set(name);
  }, [name, set]);
  return null;
}
