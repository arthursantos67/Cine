"use client";

import { useCallback, useId, useRef, useState } from "react";
import { cn } from "@/components/ui/classNames";

type StarRatingDisplayProps = {
  mode: "display";
  value: number;
  max?: number;
  className?: string;
  label?: string;
};

type StarRatingInteractiveProps = {
  mode: "interactive";
  value: number;
  onChange: (value: number) => void;
  max?: number;
  className?: string;
  label?: string;
};

export type StarRatingProps = StarRatingDisplayProps | StarRatingInteractiveProps;

type StarFill = "full" | "half" | "empty";

function getStarFill(starIndex: number, value: number): StarFill {
  const diff = value - starIndex;
  if (diff >= 1) return "full";
  if (diff >= 0.5) return "half";
  return "empty";
}

function StarIcon({ fill }: { fill: StarFill }) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height="20"
      viewBox="0 0 20 20"
      width="20"
      xmlns="http://www.w3.org/2000/svg"
    >
      {fill === "half" && (
        <defs>
          <linearGradient id="half-fill" x1="0" x2="1" y1="0" y2="0">
            <stop offset="50%" stopColor="var(--color-cinema-gold)" />
            <stop offset="50%" stopColor="var(--color-cinema-gold)" stopOpacity="0.15" />
          </linearGradient>
        </defs>
      )}
      <path
        d="M10 1.5l2.47 5.01 5.53.8-4 3.9.94 5.49L10 14.27l-4.94 2.59.94-5.49-4-3.9 5.53-.8L10 1.5z"
        fill={
          fill === "full"
            ? "var(--color-cinema-gold)"
            : fill === "half"
            ? "url(#half-fill)"
            : "var(--color-cinema-gold)"
        }
        opacity={fill === "empty" ? 0.15 : 1}
        stroke="var(--color-cinema-gold)"
        strokeLinejoin="round"
        strokeOpacity={fill === "empty" ? 0.3 : 1}
        strokeWidth="1"
      />
    </svg>
  );
}

export function StarRating(props: StarRatingProps) {
  const { max = 5, className, label } = props;
  const uid = useId();

  if (props.mode === "display") {
    const stars = Array.from({ length: max }, (_, i) =>
      getStarFill(i, props.value)
    );

    return (
      <div
        aria-label={label ?? `${props.value.toFixed(1)} de ${max} estrelas`}
        className={cn("flex flex-row items-center gap-0.5", className)}
        role="img"
      >
        {stars.map((fill, i) => (
          <StarIcon fill={fill} key={i} />
        ))}
      </div>
    );
  }

  return (
    <StarRatingInteractive
      {...props}
      max={max}
      uid={uid}
      label={label}
    />
  );
}

function StarRatingInteractive({
  className,
  label,
  max,
  onChange,
  uid,
  value,
}: {
  className?: string;
  label?: string;
  max: number;
  onChange: (v: number) => void;
  uid: string;
  value: number;
}) {
  const [hovered, setHovered] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const displayValue = hovered ?? value;

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, starValue: number) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onChange(starValue);
      }
      if (e.key === "ArrowRight" && starValue < max) {
        (
          containerRef.current?.querySelector<HTMLElement>(
            `[data-star="${starValue + 1}"]`
          )
        )?.focus();
      }
      if (e.key === "ArrowLeft" && starValue > 1) {
        (
          containerRef.current?.querySelector<HTMLElement>(
            `[data-star="${starValue - 1}"]`
          )
        )?.focus();
      }
    },
    [max, onChange]
  );

  return (
    <div
      aria-label={label ?? "Avaliação por estrelas"}
      className={cn("flex flex-row items-center gap-0.5", className)}
      onMouseLeave={() => setHovered(null)}
      ref={containerRef}
      role="group"
    >
      {Array.from({ length: max }, (_, i) => {
        const starValue = i + 1;
        const fill = getStarFill(i, displayValue);
        const isSelected = value === starValue;
        const starLabel = `${starValue} estrela${starValue > 1 ? "s" : ""}`;

        return (
          <button
            aria-label={starLabel}
            aria-pressed={isSelected}
            className="p-0.5 rounded cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-cinema-gold)] hover:scale-110 transition-transform"
            data-star={starValue}
            key={`${uid}-star-${starValue}`}
            onClick={() => onChange(starValue)}
            onMouseEnter={() => setHovered(starValue)}
            onKeyDown={(e) => handleKeyDown(e, starValue)}
            type="button"
          >
            <StarIcon fill={fill} />
          </button>
        );
      })}
    </div>
  );
}
