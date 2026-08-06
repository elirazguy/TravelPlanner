import { Navigation } from "lucide-react";
import { googleMapsNavUrl, wazeNavUrl, hasNavTarget, type NavTarget } from "@/lib/nav";

// Two small "navigate with" deep-link pills (Google Maps + Waze). Renders
// nothing when the target has no usable location.
export function NavButtons({
  target,
  className = "",
}: {
  target: NavTarget;
  className?: string;
}) {
  if (!hasNavTarget(target)) return null;
  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <a
        href={googleMapsNavUrl(target)}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700 ring-1 ring-blue-200 transition-colors hover:bg-blue-100"
        title="ניווט עם Google Maps"
      >
        <Navigation size={10} /> Google Maps
      </a>
      <a
        href={wazeNavUrl(target)}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="inline-flex items-center gap-1 rounded-full bg-cyan-50 px-2 py-0.5 text-[11px] font-medium text-cyan-700 ring-1 ring-cyan-200 transition-colors hover:bg-cyan-100"
        title="ניווט עם Waze"
      >
        <Navigation size={10} /> Waze
      </a>
    </div>
  );
}
