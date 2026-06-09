"use client";

import { ChevronDown, Languages } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/components/ui/classNames";
import { useI18n, type Locale } from "@/i18n";

export function LanguageSwitcher() {
  const { locale, setLocale, supportedLocales, t } = useI18n();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [open]);

  return (
    <div className="relative" ref={containerRef}>
      <button
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={t("language.label")}
        className="inline-flex min-h-10 items-center gap-1.5 rounded-[6px] border border-white/[0.16] bg-white/[0.03] px-2.5 text-sm font-bold text-white/70 transition hover:bg-white/[0.08] hover:text-white"
        onClick={() => setOpen((prev) => !prev)}
        type="button"
      >
        <Languages aria-hidden="true" size={16} />
        <span>{t(`language.${locale}`)}</span>
        <ChevronDown
          aria-hidden="true"
          className={cn("transition-transform duration-150", open && "rotate-180")}
          size={14}
        />
      </button>

      {open && (
        <ul
          className="absolute right-0 top-full z-50 mt-1 min-w-[130px] overflow-hidden rounded-[8px] border border-white/[0.12] bg-[rgb(16_20_30/0.97)] py-1 shadow-lg [backdrop-filter:blur(20px)]"
          role="listbox"
        >
          {supportedLocales.map((supportedLocale) => (
            <li key={supportedLocale} role="option" aria-selected={locale === supportedLocale}>
              <button
                className={cn(
                  "w-full px-3 py-2 text-left text-sm font-bold transition-colors hover:bg-white/[0.08]",
                  locale === supportedLocale ? "text-white" : "text-white/55"
                )}
                onClick={() => {
                  setLocale(supportedLocale as Locale);
                  setOpen(false);
                }}
                type="button"
              >
                {t(`language.${supportedLocale}`)}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
