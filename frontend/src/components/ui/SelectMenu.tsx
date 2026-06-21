"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ChevronDown, Check } from "lucide-react";

import { cn } from "./classNames";
import type { SelectOption } from "./Select";

type SelectMenuProps = {
  disabled?: boolean;
  error?: string;
  label: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  required?: boolean;
  value: string;
};

export function SelectMenu({
  disabled,
  error,
  label,
  onChange,
  options,
  placeholder,
  required,
  value,
}: SelectMenuProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const buttonId = useId();
  const listId = useId();
  const errorId = error ? `${buttonId}-error` : undefined;

  const selected = options.find((o) => o.value === value);
  const displayLabel = selected?.label ?? placeholder ?? "";
  const hasValue = Boolean(selected);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (open) {
      const firstSelected = listRef.current?.querySelector<HTMLLIElement>('[aria-selected="true"]');
      const firstItem = listRef.current?.querySelector<HTMLLIElement>('[role="option"]');
      (firstSelected ?? firstItem)?.focus();
    }
  }, [open]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      setOpen(false);
    }
  }

  function handleOptionKeyDown(e: React.KeyboardEvent<HTMLLIElement>, optionValue: string) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onChange(optionValue);
      setOpen(false);
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      (e.currentTarget.nextElementSibling as HTMLLIElement | null)?.focus();
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      (e.currentTarget.previousElementSibling as HTMLLIElement | null)?.focus();
    }
    if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div className="grid gap-1.5" ref={containerRef}>
      <label className="text-sm font-extrabold text-white" htmlFor={buttonId}>
        {label}
        {required ? <span aria-hidden="true" className="ml-0.5 text-error">*</span> : null}
      </label>
      <div className="relative">
        <button
          aria-controls={listId}
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-invalid={error ? "true" : undefined}
          aria-required={required}
          className={cn(
            "flex min-h-[var(--control-height-lg)] w-full items-center justify-between gap-2 rounded-control border bg-surface px-3 py-2",
            "text-sm text-left outline-none transition-colors duration-150",
            "focus:border-brand focus:shadow-focus",
            "disabled:cursor-not-allowed disabled:opacity-[0.68]",
            hasValue ? "text-white" : "text-white/30",
            error ? "border-error" : "border-border"
          )}
          disabled={disabled}
          id={buttonId}
          onClick={() => setOpen((prev) => !prev)}
          onKeyDown={handleKeyDown}
          type="button"
        >
          <span className="truncate">{displayLabel}</span>
          <ChevronDown
            aria-hidden="true"
            className={cn(
              "size-4 shrink-0 text-white/40 transition-transform duration-150",
              open && "rotate-180"
            )}
          />
        </button>

        {open ? (
          <ul
            aria-label={label}
            className="absolute z-50 mt-1 max-h-64 w-full overflow-auto rounded-[8px] border border-white/[0.10] bg-[#1e2535] py-1 shadow-lg"
            id={listId}
            ref={listRef}
            role="listbox"
          >
            {placeholder ? (
              <li
                aria-selected={!hasValue}
                className={cn(
                  "cursor-pointer px-3 py-2.5 text-sm outline-none transition",
                  "hover:bg-white/[0.06] focus:bg-white/[0.06]",
                  !hasValue ? "text-white/60" : "text-white/30"
                )}
                onClick={() => {
                  onChange("");
                  setOpen(false);
                }}
                onKeyDown={(e) => handleOptionKeyDown(e, "")}
                role="option"
                tabIndex={0}
              >
                {placeholder}
              </li>
            ) : null}
            {options.map((option) => {
              const isSelected = option.value === value;
              return (
                <li
                  aria-selected={isSelected}
                  className={cn(
                    "flex cursor-pointer items-center gap-2 px-3 py-2.5 text-sm outline-none transition",
                    "hover:bg-white/[0.06] focus:bg-white/[0.06]",
                    option.disabled && "cursor-not-allowed opacity-40",
                    isSelected ? "text-brand font-bold" : "text-white/80"
                  )}
                  key={option.value}
                  onClick={() => {
                    if (!option.disabled) {
                      onChange(option.value);
                      setOpen(false);
                    }
                  }}
                  onKeyDown={(e) => handleOptionKeyDown(e, option.value)}
                  role="option"
                  tabIndex={0}
                >
                  <Check
                    aria-hidden="true"
                    className={cn("size-3.5 shrink-0", isSelected ? "opacity-100" : "opacity-0")}
                  />
                  <span className="truncate">{option.label}</span>
                </li>
              );
            })}
          </ul>
        ) : null}
      </div>
      {error ? (
        <p className="text-sm font-bold text-error" id={errorId} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
