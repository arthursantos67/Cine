"use client";

import { useEffect, useState } from "react";

const WEEK_DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

type MultiDatePickerProps = {
  baseDate: string;
  disabled?: boolean;
  onChange: (dates: string[]) => void;
  selectedDates: string[];
};

function toDateKey(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function parseYMD(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return { year: y, month: m - 1, day: d };
}

export function MultiDatePicker({
  baseDate,
  disabled,
  onChange,
  selectedDates,
}: MultiDatePickerProps) {
  const today = new Date();
  const todayKey = toDateKey(today.getFullYear(), today.getMonth(), today.getDate());

  const [viewYear, setViewYear] = useState(() => {
    if (baseDate) return parseYMD(baseDate).year;
    return today.getFullYear();
  });
  const [viewMonth, setViewMonth] = useState(() => {
    if (baseDate) return parseYMD(baseDate).month;
    return today.getMonth();
  });

  useEffect(() => {
    if (!baseDate) return;
    const { year, month } = parseYMD(baseDate);
    setViewYear(year);
    setViewMonth(month);
  }, [baseDate]);

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
  }

  function toggleDate(key: string) {
    if (disabled || key === baseDate) return;
    if (selectedDates.includes(key)) {
      onChange(selectedDates.filter((d) => d !== key));
    } else {
      onChange([...selectedDates, key].sort());
    }
  }

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDay = new Date(viewYear, viewMonth, 1).getDay();

  const cells: Array<string | null> = [
    ...Array.from({ length: firstDay }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) =>
      toDateKey(viewYear, viewMonth, i + 1)
    ),
  ];

  const allSelected = [baseDate, ...selectedDates].filter(Boolean);

  return (
    <div className="grid gap-3">
      <div className="rounded-[10px] border border-border bg-[#0d0d0d] p-4">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <button
            aria-label="Mês anterior"
            className="flex h-8 w-8 items-center justify-center rounded-md text-lg text-white/50 transition hover:bg-white/10 disabled:opacity-30"
            disabled={disabled}
            onClick={prevMonth}
            type="button"
          >
            ‹
          </button>
          <span className="text-sm font-bold text-white">
            {MONTHS[viewMonth]} {viewYear}
          </span>
          <button
            aria-label="Próximo mês"
            className="flex h-8 w-8 items-center justify-center rounded-md text-lg text-white/50 transition hover:bg-white/10 disabled:opacity-30"
            disabled={disabled}
            onClick={nextMonth}
            type="button"
          >
            ›
          </button>
        </div>

        {/* Week headers */}
        <div className="mb-1 grid grid-cols-7 text-center">
          {WEEK_DAYS.map((d) => (
            <span
              key={d}
              className="text-[10px] font-extrabold uppercase tracking-widest text-white/25"
            >
              {d}
            </span>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 gap-y-1 text-center">
          {cells.map((key, idx) => {
            if (!key) return <span key={`e-${idx}`} />;

            const isBase = key === baseDate;
            const isExtra = selectedDates.includes(key);
            const isToday = key === todayKey;

            return (
              <button
                key={key}
                aria-pressed={isBase || isExtra}
                className={[
                  "mx-auto flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition",
                  isBase
                    ? "cursor-default bg-brand font-extrabold text-white ring-2 ring-brand/40"
                    : isExtra
                      ? "bg-brand/30 font-bold text-white hover:bg-brand/50"
                      : isToday
                        ? "border border-white/20 text-white/80 hover:bg-white/10"
                        : "text-white/60 hover:bg-white/8 hover:text-white",
                  disabled ? "pointer-events-none opacity-40" : "",
                ].join(" ")}
                disabled={disabled}
                onClick={() => toggleDate(key)}
                type="button"
              >
                {Number(key.slice(8))}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected dates chips */}
      {allSelected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {allSelected.sort().map((d) => {
            const isBase = d === baseDate;
            const [y, m, day] = d.split("-");
            const label = `${day}/${m}/${y}`;
            return (
              <span
                key={d}
                className={[
                  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold",
                  isBase
                    ? "bg-brand text-white"
                    : "bg-brand/20 text-white/80",
                ].join(" ")}
              >
                {label}
                {!isBase && !disabled && (
                  <button
                    aria-label={`Remover ${label}`}
                    className="ml-0.5 opacity-60 hover:opacity-100"
                    onClick={() => toggleDate(d)}
                    type="button"
                  >
                    ×
                  </button>
                )}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
