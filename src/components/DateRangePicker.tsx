"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  format,
  addMonths,
  subMonths,
  isBefore,
  isAfter,
  isSameDay,
  parseISO,
  isValid,
} from "date-fns";
import { he } from "date-fns/locale";
import { cn } from "@/lib/utils";

const WEEK_DAYS = ["א׳", "ב׳", "ג׳", "ד׳", "ה׳", "ו׳", "ש׳"];

interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  onChange: (start: string, end: string) => void;
}

export function DateRangePicker({ startDate, endDate, onChange }: DateRangePickerProps) {
  const [leftMonth, setLeftMonth] = useState(() => {
    if (startDate) {
      const d = parseISO(startDate);
      if (isValid(d)) return startOfMonth(d);
    }
    return startOfMonth(new Date());
  });
  const [hoverDay, setHoverDay] = useState<Date | null>(null);
  const [open, setOpen] = useState(false);
  const [pickStep, setPickStep] = useState<"start" | "end">("start");
  const containerRef = useRef<HTMLDivElement>(null);

  const rightMonth = addMonths(leftMonth, 1);
  const start = startDate && isValid(parseISO(startDate)) ? parseISO(startDate) : null;
  const end = endDate && isValid(parseISO(endDate)) ? parseISO(endDate) : null;

  function handleOpen() {
    setOpen(true);
    setPickStep(start && !end ? "end" : "start");
  }

  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  function handleDayClick(day: Date) {
    if (pickStep === "start") {
      onChange(format(day, "yyyy-MM-dd"), "");
      setPickStep("end");
    } else {
      if (start && isBefore(day, start)) {
        onChange(format(day, "yyyy-MM-dd"), format(start, "yyyy-MM-dd"));
      } else {
        onChange(startDate, format(day, "yyyy-MM-dd"));
      }
      setPickStep("start");
      setOpen(false);
    }
  }

  const displayValue =
    start && end
      ? `${format(start, "dd/MM/yyyy")} – ${format(end, "dd/MM/yyyy")}`
      : start
      ? `${format(start, "dd/MM/yyyy")} – ?`
      : "";

  // During end-picking: show hover preview; otherwise show committed end
  const rangeEnd = pickStep === "end" && hoverDay ? hoverDay : end;

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={handleOpen}
        className={cn(
          "flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors",
          open
            ? "border-brand-500 ring-2 ring-brand-500/20"
            : "border-ink-200 hover:border-ink-300",
          displayValue ? "text-ink-900" : "text-ink-400"
        )}
      >
        <CalendarDays size={15} className="shrink-0 text-ink-400" />
        <span className="flex-1 text-right">{displayValue || "בחר תאריכים"}</span>
      </button>

      {open && (
        <div
          className="absolute right-0 top-full z-50 mt-1 rounded-xl border border-ink-200 bg-white p-4 shadow-xl"
          dir="ltr"
        >
          <div className="flex gap-3">
            <MonthGrid
              month={leftMonth}
              start={start}
              rangeEnd={rangeEnd}
              onDay={handleDayClick}
              onHover={setHoverDay}
              showPrev
              showNext={false}
              onPrev={() => setLeftMonth(subMonths(leftMonth, 1))}
              onNext={() => setLeftMonth(addMonths(leftMonth, 1))}
            />
            <div className="w-px self-stretch bg-ink-100" />
            <MonthGrid
              month={rightMonth}
              start={start}
              rangeEnd={rangeEnd}
              onDay={handleDayClick}
              onHover={setHoverDay}
              showPrev={false}
              showNext
              onPrev={() => setLeftMonth(subMonths(leftMonth, 1))}
              onNext={() => setLeftMonth(addMonths(leftMonth, 1))}
            />
          </div>
          <p className="mt-3 border-t border-ink-100 pt-2 text-center text-xs text-ink-400">
            {pickStep === "start" ? "בחר תאריך התחלה" : "כעת בחר תאריך סיום"}
          </p>
        </div>
      )}
    </div>
  );
}

function MonthGrid({
  month,
  start,
  rangeEnd,
  onDay,
  onHover,
  onPrev,
  onNext,
  showPrev,
  showNext,
}: {
  month: Date;
  start: Date | null;
  rangeEnd: Date | null;
  onDay: (d: Date) => void;
  onHover: (d: Date | null) => void;
  onPrev: () => void;
  onNext: () => void;
  showPrev: boolean;
  showNext: boolean;
}) {
  const days = eachDayOfInterval({ start: startOfMonth(month), end: endOfMonth(month) });
  const offset = getDay(startOfMonth(month));

  function normalizedRange() {
    if (!start || !rangeEnd) return { s: null, e: null };
    return isBefore(rangeEnd, start)
      ? { s: rangeEnd, e: start }
      : { s: start, e: rangeEnd };
  }

  const { s: rangeS, e: rangeE } = normalizedRange();

  return (
    <div className="w-44">
      <div className="mb-2 flex items-center justify-between">
        <button
          type="button"
          onClick={onPrev}
          className={cn(
            "rounded p-1 text-ink-400 hover:bg-ink-100",
            !showPrev && "invisible pointer-events-none"
          )}
        >
          <ChevronLeft size={15} />
        </button>
        <span className="text-xs font-semibold text-ink-900">
          {format(month, "MMMM yyyy", { locale: he })}
        </span>
        <button
          type="button"
          onClick={onNext}
          className={cn(
            "rounded p-1 text-ink-400 hover:bg-ink-100",
            !showNext && "invisible pointer-events-none"
          )}
        >
          <ChevronRight size={15} />
        </button>
      </div>

      <div className="mb-1 grid grid-cols-7 text-center">
        {WEEK_DAYS.map((d) => (
          <div key={d} className="py-0.5 text-[10px] font-medium text-ink-400">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {Array.from({ length: offset }).map((_, i) => <div key={`p${i}`} />)}
        {days.map((day) => {
          const isStart = start ? isSameDay(day, start) : false;
          const isEnd = rangeEnd ? isSameDay(day, rangeEnd) : false;
          const inRange =
            rangeS && rangeE
              ? isAfter(day, rangeS) && isBefore(day, rangeE)
              : false;
          const isSelected = isStart || isEnd;

          return (
            <button
              key={day.toISOString()}
              type="button"
              onClick={() => onDay(day)}
              onMouseEnter={() => onHover(day)}
              onMouseLeave={() => onHover(null)}
              className={cn(
                "flex h-7 w-full items-center justify-center text-[11px] transition-colors",
                isSelected
                  ? "rounded-full bg-brand-600 font-bold text-white"
                  : inRange
                  ? "bg-brand-50 text-ink-800"
                  : "rounded hover:bg-brand-100 text-ink-800 cursor-pointer"
              )}
            >
              {day.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}
