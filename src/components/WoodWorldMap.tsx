"use client";

import { useEffect, useMemo, useState } from "react";
import { geoNaturalEarth1, geoPath, geoCentroid } from "d3-geo";
import { feature } from "topojson-client";
import type { Feature, Geometry } from "geojson";
import { iso2ForNumeric, flagEmoji } from "@/lib/countries";

const W = 980;
const H = 500;

// Deterministic hash so each country gets a stable wood variation.
function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

interface Props {
  visited: string[]; // ISO numeric codes
  planned: string[]; // ISO numeric codes
}

export function WoodWorldMap({ visited, planned }: Props) {
  const [features, setFeatures] = useState<Feature<Geometry>[] | null>(null);

  useEffect(() => {
    let alive = true;
    fetch("/world-110m.json")
      .then((r) => r.json())
      .then((topo) => {
        if (!alive) return;
        const fc = feature(topo, topo.objects.countries) as unknown as {
          features: Feature<Geometry>[];
        };
        setFeatures(fc.features.filter((f) => String(f.id) !== "010")); // drop Antarctica
      })
      .catch(() => setFeatures([]));
    return () => {
      alive = false;
    };
  }, []);

  const visitedSet = useMemo(() => new Set(visited), [visited]);
  const plannedSet = useMemo(() => new Set(planned), [planned]);

  const { paths, pins } = useMemo(() => {
    if (!features || features.length === 0) return { paths: [], pins: [] };
    const projection = geoNaturalEarth1().fitExtent(
      [
        [10, 10],
        [W - 10, H - 10],
      ],
      { type: "FeatureCollection", features } as never
    );
    const path = geoPath(projection);

    const paths = features.map((f) => {
      const id = String(f.id).padStart(3, "0");
      const d = path(f) ?? "";
      const isVisited = visitedSet.has(id);
      const isPlanned = !isVisited && plannedSet.has(id);
      const h = hash(id);
      const pattern = h % 2 === 0 ? "woodH" : "woodV";
      const brightness = 0.82 + (h % 32) / 100; // 0.82–1.13
      const sat = 0.9 + ((h >> 3) % 28) / 100; // 0.90–1.17
      const hue = -8 + ((h >> 5) % 16); // -8..7 deg
      return {
        id,
        d,
        pattern,
        filter: `brightness(${brightness.toFixed(2)}) saturate(${sat.toFixed(2)}) hue-rotate(${hue}deg)`,
        isVisited,
        isPlanned,
        name: (f.properties as { name?: string } | null)?.name ?? "",
      };
    });

    const pins = features
      .filter((f) => visitedSet.has(String(f.id).padStart(3, "0")))
      .map((f) => {
        const id = String(f.id).padStart(3, "0");
        const c = geoCentroid(f);
        const xy = projection(c);
        if (!xy) return null;
        const iso2 = iso2ForNumeric(id);
        return {
          id,
          x: xy[0],
          y: xy[1],
          flag: iso2 ? flagEmoji(iso2) : "📍",
          name: (f.properties as { name?: string } | null)?.name ?? "",
        };
      })
      .filter((p): p is NonNullable<typeof p> => p !== null);

    return { paths, pins };
  }, [features, visitedSet, plannedSet]);

  return (
    <div className="rounded-2xl border border-white/60 bg-gradient-to-b from-amber-50/70 to-orange-50/40 p-4 shadow-card backdrop-blur-md sm:p-6">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="font-display text-xl font-extrabold text-ink-900">
            המסעות שלך על המפה
          </h2>
          <p className="text-xs text-ink-500">
            מפת עץ של העולם — המדינות שביקרת בהן מסומנות בנעץ, והמתוכננות בגבול צבעוני.
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs text-ink-600">
          <span className="flex items-center gap-1.5">
            <span className="flex h-4 w-4 items-center justify-center rounded-full border-2 border-emerald-600 bg-white text-[8px]">
              ✓
            </span>
            ביקרתי
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-5 rounded-sm border-2 border-amber-600 bg-amber-100/40" />
            מתוכנן
          </span>
        </div>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full"
        role="img"
        aria-label="מפת עץ של העולם עם המדינות שביקרת בהן ושתכננת"
      >
        <defs>
          <pattern id="woodH" patternUnits="userSpaceOnUse" width="120" height="120">
            <image
              href="/textures/wood.jpg?v=1"
              x="0"
              y="0"
              width="120"
              height="120"
              preserveAspectRatio="xMidYMid slice"
            />
          </pattern>
          <pattern
            id="woodV"
            patternUnits="userSpaceOnUse"
            width="120"
            height="120"
            patternTransform="rotate(90)"
          >
            <image
              href="/textures/wood.jpg?v=1"
              x="0"
              y="0"
              width="120"
              height="120"
              preserveAspectRatio="xMidYMid slice"
            />
          </pattern>
          <filter id="pinShadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="1" stdDeviation="1.2" floodColor="#000" floodOpacity="0.35" />
          </filter>
        </defs>

        {!features && (
          <text x={W / 2} y={H / 2} textAnchor="middle" className="fill-ink-300 text-sm">
            טוען מפה...
          </text>
        )}

        {/* Countries */}
        {paths.map((p) => (
          <path
            key={p.id}
            d={p.d}
            fill={`url(#${p.pattern})`}
            style={{ filter: p.filter }}
            stroke={p.isVisited ? "#047857" : p.isPlanned ? "#b45309" : "#4a2f17"}
            strokeWidth={p.isVisited || p.isPlanned ? 1.3 : 0.4}
            strokeOpacity={p.isVisited || p.isPlanned ? 1 : 0.55}
          >
            <title>{p.name}</title>
          </path>
        ))}

        {/* Planned highlight overlay (subtle warm tint) */}
        {paths
          .filter((p) => p.isPlanned)
          .map((p) => (
            <path key={`pl-${p.id}`} d={p.d} fill="#f59e0b" fillOpacity={0.18} pointerEvents="none" />
          ))}

        {/* Visited pins */}
        {pins.map((pin) => (
          <g key={`pin-${pin.id}`} transform={`translate(${pin.x},${pin.y})`}>
            <circle r="12" fill="#ffffff" stroke="#047857" strokeWidth="2.2" filter="url(#pinShadow)" />
            <text textAnchor="middle" dominantBaseline="central" fontSize="13">
              {pin.flag}
            </text>
            <title>{pin.name}</title>
          </g>
        ))}
      </svg>

      {visited.length === 0 && planned.length === 0 && (
        <p className="mt-3 text-center text-xs text-ink-400">
          צור טיולים כדי לראות את המדינות נדלקות על המפה ✈️
        </p>
      )}
    </div>
  );
}
