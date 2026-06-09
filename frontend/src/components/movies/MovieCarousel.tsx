"use client";

import type { KeyboardEvent, MouseEvent } from "react";
import { useEffect, useId, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import type { CatalogMovie } from "@/types/catalog";
import { StateMessage } from "@/components/ui/StateMessage";
import { useI18n } from "@/i18n";

import { MovieCard } from "./MovieCard";

type MovieCarouselProps = {
  ariaLabel?: string;
  emptyDescription?: string;
  emptyTitle?: string;
  isLoading?: boolean;
  loadingLabel?: string;
  movies: CatalogMovie[];
  nextButtonLabel?: string;
  previousButtonLabel?: string;
  skeletonCount?: number;
  title: string;
  titleVisible?: boolean;
};

const railClasses = [
  "m-0 list-none cursor-grab",
  "grid grid-flow-col gap-[18px]",
  "[grid-auto-columns:clamp(180px,22vw,220px)]",
  "max-[820px]:[grid-auto-columns:clamp(180px,44vw,240px)]",
  "max-[420px]:[grid-auto-columns:minmax(210px,84vw)]",
  "overflow-x-auto overscroll-x-contain pb-3",
  "[scroll-padding-inline:2px] [scroll-snap-type:x_mandatory]",
  "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
].join(" ");

const itemClasses = "grid min-w-0 [scroll-snap-align:start]";

export function MovieCarousel({
  ariaLabel,
  emptyDescription,
  emptyTitle,
  isLoading = false,
  loadingLabel,
  movies,
  nextButtonLabel,
  previousButtonLabel,
  skeletonCount = 6,
  title,
  titleVisible = true,
}: MovieCarouselProps) {
  const { t } = useI18n();
  const railRef = useRef<HTMLUListElement>(null);
  const [canScroll, setCanScroll] = useState(movies.length > 1);
  const isDragging = useRef(false);
  const dragStartX = useRef(0);
  const dragScrollLeft = useRef(0);
  const lastDragX = useRef(0);
  const lastDragTime = useRef(0);
  const velocityX = useRef(0);
  const uid = useId();
  const headingId = `movie-carousel-${uid}`;

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;
    const check = () => setCanScroll(rail.scrollWidth > rail.clientWidth + 1);
    check();
    const ro = new ResizeObserver(check);
    ro.observe(rail);
    return () => ro.disconnect();
  }, [movies.length]);

  function scrollRail(direction: "next" | "previous") {
    const rail = railRef.current;
    if (!rail) return;

    const { scrollLeft, clientWidth, scrollWidth } = rail;
    const maxScroll = scrollWidth - clientWidth;
    const scrollDistance = Math.max(clientWidth * 0.85, 220);

    if (direction === "next") {
      rail.scrollTo({
        behavior: "smooth",
        left: scrollLeft + 10 >= maxScroll ? 0 : scrollLeft + scrollDistance,
      });
    } else {
      rail.scrollTo({
        behavior: "smooth",
        left: scrollLeft <= 10 ? maxScroll : scrollLeft - scrollDistance,
      });
    }
  }

  function handleMouseDown(e: MouseEvent<HTMLUListElement>) {
    if (e.button !== 0) return;
    isDragging.current = true;
    dragStartX.current = e.pageX;
    dragScrollLeft.current = railRef.current?.scrollLeft ?? 0;
    lastDragX.current = e.pageX;
    lastDragTime.current = Date.now();
    velocityX.current = 0;
    const rail = railRef.current;
    if (rail) {
      rail.style.cursor = "grabbing";
      rail.style.userSelect = "none";
    }
  }

  function handleMouseMove(e: MouseEvent<HTMLUListElement>) {
    if (!isDragging.current || !railRef.current) return;
    e.preventDefault();

    const now = Date.now();
    const elapsed = Math.max(now - lastDragTime.current, 1);
    const dx = e.pageX - lastDragX.current;
    velocityX.current = velocityX.current * 0.6 + (dx / elapsed) * 0.4;
    lastDragX.current = e.pageX;
    lastDragTime.current = now;

    railRef.current.scrollLeft =
      dragScrollLeft.current - (e.pageX - dragStartX.current);
  }

  function handleDragEnd() {
    if (!isDragging.current) return;
    isDragging.current = false;
    const rail = railRef.current;
    if (!rail) return;

    rail.style.cursor = "";
    rail.style.userSelect = "";

    const momentumPx = velocityX.current * 300;
    if (Math.abs(momentumPx) > 4) {
      const { scrollLeft, scrollWidth, clientWidth } = rail;
      const target = Math.max(
        0,
        Math.min(scrollLeft - momentumPx, scrollWidth - clientWidth)
      );
      rail.scrollTo({ behavior: "smooth", left: target });
    }

    velocityX.current = 0;
  }

  return (
    <section
      aria-busy={isLoading || undefined}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabel ? undefined : headingId}
      className="grid gap-4"
    >
      <div className="flex min-h-[40px] items-center">
        <h2
          className={
            titleVisible
              ? "m-0 text-2xl font-extrabold leading-[1.2]"
              : "sr-only"
          }
          id={headingId}
        >
          {title}
        </h2>
      </div>

      {isLoading ? (
        <div className="grid gap-3" role="status">
          <span className="font-[750] text-muted">
            {loadingLabel ?? t("catalog.loadingMovies")}
          </span>
          <ul aria-hidden="true" className={railClasses} role="list">
            {Array.from({ length: skeletonCount }, (_, index) => (
              <li className={itemClasses} key={index}>
                <div className="h-full overflow-hidden rounded-card bg-[#1e2535]">
                  <div className="aspect-[2/3] w-full animate-pulse bg-surface-muted" />
                  <div className="grid content-start gap-2 p-[14px]">
                    <span className="block h-[18px] w-full animate-pulse rounded-full bg-surface-muted" />
                    <span className="block h-3 w-full animate-pulse rounded-full bg-surface-muted" />
                    <span className="block h-3 w-[52%] animate-pulse rounded-full bg-surface-muted" />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {!isLoading && movies.length === 0 ? (
        <StateMessage title={emptyTitle ?? t("catalog.emptyTitle")}>
          {emptyDescription ?? t("catalog.emptyDescription")}
        </StateMessage>
      ) : null}

      {!isLoading && movies.length > 0 ? (
        <div className="relative min-w-0">
          {canScroll ? (
            <button
              aria-label={
                previousButtonLabel ?? t("catalog.previousMovieIn", { title })
              }
              className="absolute left-1 top-[42%] z-[2] flex h-[52px] w-9 -translate-y-1/2 items-center justify-center rounded-[6px] border-0 bg-white/55 text-[rgba(20,20,20,0.65)] shadow-[0_1px_4px_rgb(0_0_0/0.12)] transition-[background-color,box-shadow,transform,color] duration-[180ms] hover:scale-[1.08] hover:bg-white/[0.92] hover:text-[rgba(20,20,20,0.9)] hover:shadow-[0_2px_8px_rgb(0_0_0/0.18)] focus-visible:outline-none focus-visible:shadow-focus"
              onClick={() => scrollRail("previous")}
              type="button"
            >
              <ChevronLeft aria-hidden="true" size={18} strokeWidth={2.5} />
            </button>
          ) : null}

          <ul
            aria-label={t("catalog.movieCarouselA11y", { title })}
            className={railClasses}
            onDragStart={(e) => e.preventDefault()}
            onKeyDown={handleCarouselKeyDown}
            onMouseDown={handleMouseDown}
            onMouseLeave={handleDragEnd}
            onMouseMove={handleMouseMove}
            onMouseUp={handleDragEnd}
            ref={railRef}
            role="list"
          >
            {movies.map((movie) => (
              <li className={itemClasses} key={movie.id}>
                <MovieCard movie={movie} />
              </li>
            ))}
          </ul>

          {canScroll ? (
            <button
              aria-label={nextButtonLabel ?? t("catalog.nextMovieIn", { title })}
              className="absolute right-1 top-[42%] z-[2] flex h-[52px] w-9 -translate-y-1/2 items-center justify-center rounded-[6px] border-0 bg-white/55 text-[rgba(20,20,20,0.65)] shadow-[0_1px_4px_rgb(0_0_0/0.12)] transition-[background-color,box-shadow,transform,color] duration-[180ms] hover:scale-[1.08] hover:bg-white/[0.92] hover:text-[rgba(20,20,20,0.9)] hover:shadow-[0_2px_8px_rgb(0_0_0/0.18)] focus-visible:outline-none focus-visible:shadow-focus"
              onClick={() => scrollRail("next")}
              type="button"
            >
              <ChevronRight aria-hidden="true" size={18} strokeWidth={2.5} />
            </button>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

function handleCarouselKeyDown(event: KeyboardEvent<HTMLUListElement>) {
  if (
    event.key !== "ArrowLeft" &&
    event.key !== "ArrowRight" &&
    event.key !== "Home" &&
    event.key !== "End"
  ) {
    return;
  }

  const cards = Array.from(
    event.currentTarget.querySelectorAll<HTMLAnchorElement>(
      "[data-carousel-item-link]"
    )
  );

  if (cards.length === 0) return;

  const activeElement = document.activeElement;
  const activeIndex = cards.findIndex((card) => card === activeElement);
  let nextIndex = activeIndex >= 0 ? activeIndex : 0;

  if (event.key === "ArrowRight") nextIndex = Math.min(nextIndex + 1, cards.length - 1);
  if (event.key === "ArrowLeft") nextIndex = Math.max(nextIndex - 1, 0);
  if (event.key === "Home") nextIndex = 0;
  if (event.key === "End") nextIndex = cards.length - 1;

  event.preventDefault();
  cards[nextIndex].focus();
  cards[nextIndex].scrollIntoView({
    behavior: "smooth",
    block: "nearest",
    inline: "nearest",
  });
}
