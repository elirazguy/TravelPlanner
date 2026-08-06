import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatDate(date: Date | string, opts?: Intl.DateTimeFormatOptions) {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
    ...opts,
  });
}

export function formatDateRange(start: Date | string, end: Date | string) {
  // RTL layout: render end first so the LTR date run shows the start date on
  // the right and the end date on the left.
  return `${formatDate(end)} – ${formatDate(start)}`;
}

export function daysBetween(start: Date | string, end: Date | string): number {
  const a = new Date(start);
  const b = new Date(end);
  a.setHours(0, 0, 0, 0);
  b.setHours(0, 0, 0, 0);
  return Math.max(0, Math.round((b.getTime() - a.getTime()) / 86400000));
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

// Sort itinerary events chronologically: timed events first (by HH:mm),
// then untimed events by their manual order index.
export function sortEventsChronologically<
  T extends { startTime?: string | null; orderIndex?: number }
>(events: T[]): T[] {
  return [...events].sort((a, b) => {
    const at = a.startTime?.trim() || "";
    const bt = b.startTime?.trim() || "";
    if (at && bt) return at.localeCompare(bt);
    if (at) return -1; // timed before untimed
    if (bt) return 1;
    return (a.orderIndex ?? 0) - (b.orderIndex ?? 0);
  });
}
