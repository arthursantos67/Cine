"use client";

import Link from "next/link";
import { CalendarDays, ChevronLeft, ChevronRight, HelpCircle } from "lucide-react";
import { Fragment, type KeyboardEvent, useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { catalogApi } from "@/api/catalog";
import type { MovieSectionState } from "@/app/HomeCatalog";
import { Button } from "@/components/ui/Button";
import { cn } from "@/components/ui/classNames";
import { ResponsiveImage } from "@/components/ui/ResponsiveImage";
import { StateMessage } from "@/components/ui/StateMessage";
import type { CatalogSession } from "@/types/catalog";
import { useI18n } from "@/i18n";

import { MovieCarousel } from "./MovieCarousel";
import {
  formatMovieDuration,
  formatMovieGenres,
  getMovieDetailsHref,
} from "./movie-formatters";
import { SessionBadgeList } from "./SessionBadges";
import {
  buildSessionDateOptions,
  type ExperienceSessionGroup,
  formatScheduleDateHeading,
  formatSessionFullDate,
  formatSessionPrice,
  formatSessionTime,
  getSessionBadges,
  getRoomExperienceLabel,
  getSessionSeatsHref,
  groupSessionsByExperienceType,
  groupSessionsByMovie,
  isSessionPurchasable,
  type MovieSessionGroup,
} from "./session-selection";

type ScheduleTab = "em_breve" | "em_cartaz";

type SessionScheduleState = {
  errorMessage?: string;
  sessions: CatalogSession[];
  status: "error" | "loading" | "success";
};

export type HomeScheduleProps = {
  cinemaName?: string;
  onRetryUpcoming?: () => void;
  upcoming: MovieSectionState;
};

const SCHEDULE_TABS = [
  { value: "em_cartaz" as ScheduleTab, labelKey: "domain.movieStatus.em_cartaz" },
  { value: "em_breve" as ScheduleTab, labelKey: "domain.movieStatus.em_breve" },
] as const;

export function HomeSchedule({
  cinemaName = "CinePrime Natal",
  onRetryUpcoming,
  upcoming,
}: HomeScheduleProps) {
  const { locale, t } = useI18n();
  const [activeTab, setActiveTab] = useState<ScheduleTab>("em_cartaz");
  const uid = useId();
  const calendarInputRef = useRef<HTMLInputElement>(null);

  const dateOptions = useMemo(
    () => buildSessionDateOptions(new Date(), 7, locale),
    [locale]
  );
  const [selectedDate, setSelectedDate] = useState(dateOptions[0]?.value ?? "");
  const [scheduleState, setScheduleState] = useState<SessionScheduleState>({
    sessions: [],
    status: "loading",
  });

  const loadSessions = useCallback(async (date: string) => {
    void locale;

    if (!date) {
      setScheduleState({ sessions: [], status: "success" });
      return;
    }

    setScheduleState({ sessions: [], status: "loading" });

    try {
      const response = await catalogApi.getSessions({ date });
      setScheduleState({ sessions: response.results, status: "success" });
    } catch {
      setScheduleState({
        errorMessage: undefined,
        sessions: [],
        status: "error",
      });
    }
  }, [locale]);

  useEffect(() => {
    void loadSessions(selectedDate);
  }, [loadSessions, selectedDate]);

  function handleTabKeyDown(e: KeyboardEvent<HTMLButtonElement>, idx: number) {
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      e.preventDefault();
      const nextIdx =
        e.key === "ArrowRight"
          ? (idx + 1) % SCHEDULE_TABS.length
          : (idx - 1 + SCHEDULE_TABS.length) % SCHEDULE_TABS.length;
      setActiveTab(SCHEDULE_TABS[nextIdx].value);
      const tabList = e.currentTarget.closest('[role="tablist"]');
      const tabs = tabList?.querySelectorAll<HTMLElement>('[role="tab"]');
      tabs?.[nextIdx]?.focus();
    }
  }

  const selectedDateIdx = dateOptions.findIndex((o) => o.value === selectedDate);
  const canGoPrev = selectedDateIdx > 0;
  const canGoNext = selectedDateIdx < dateOptions.length - 1;

  function goToPrevDate() {
    if (canGoPrev) setSelectedDate(dateOptions[selectedDateIdx - 1].value);
  }

  function goToNextDate() {
    if (canGoNext) setSelectedDate(dateOptions[selectedDateIdx + 1].value);
  }

  function handleCalendarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = e.target.value;
    const match = dateOptions.find((o) => o.value === picked);
    if (match) setSelectedDate(match.value);
  }

  return (
    <section aria-label={t("schedule.times")} className="grid gap-5">
      {/* Header: tabs + cinema name — sem título visível */}
      <div className="flex flex-wrap items-center gap-y-2">
        <div
          aria-label={t("schedule.sections")}
          className="flex items-center"
          role="tablist"
        >
          {SCHEDULE_TABS.map((tab, idx) => {
            const isSelected = activeTab === tab.value;
            return (
              <Fragment key={tab.value}>
                {idx > 0 && (
                  <span aria-hidden="true" className="mx-3 select-none text-border">
                    |
                  </span>
                )}
                <button
                  aria-controls={`${uid}-${tab.value}-panel`}
                  aria-selected={isSelected}
                  className={cn(
                    "whitespace-nowrap pb-0.5 text-sm font-extrabold transition-colors duration-150 focus-visible:outline-none focus-visible:shadow-focus",
                    isSelected
                      ? "border-b-2 border-brand text-text"
                      : "text-muted hover:text-text"
                  )}
                  id={`${uid}-${tab.value}-tab`}
                  onClick={() => setActiveTab(tab.value)}
                  onKeyDown={(e) => handleTabKeyDown(e, idx)}
                  role="tab"
                  tabIndex={isSelected ? 0 : -1}
                  type="button"
                >
                  {t(tab.labelKey)}
                </button>
              </Fragment>
            );
          })}
        </div>

        <span className="ml-auto text-sm font-bold text-muted">{cinemaName}</span>
      </div>

      {/* Em cartaz panel */}
      <div
        aria-labelledby={`${uid}-em_cartaz-tab`}
        hidden={activeTab !== "em_cartaz"}
        id={`${uid}-em_cartaz-panel`}
        role="tabpanel"
        tabIndex={0}
      >
        <div className="grid gap-4">
          {/* Date carousel */}
          <div aria-label={t("schedule.selectDate")} className="flex items-stretch gap-1" role="group">
            <button
              aria-label={t("schedule.previousDate")}
              className="flex items-center justify-center rounded-control border border-border px-2 text-muted transition duration-150 hover:border-brand hover:text-text active:scale-[0.92] focus-visible:outline-none focus-visible:shadow-focus disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100"
              disabled={!canGoPrev}
              onClick={goToPrevDate}
              type="button"
            >
              <ChevronLeft className="size-4" />
            </button>

            <div className="flex min-w-0 flex-1 gap-1.5 overflow-x-auto">
              {dateOptions.map((option) => {
                const isSelected = option.value === selectedDate;
                const dayNumber = option.label.split("/")[0];
                const weekday = option.weekday.toUpperCase();
                return (
                  <button
                    aria-pressed={isSelected}
                    className={cn(
                      "flex flex-1 flex-col items-center justify-center gap-0.5 rounded-lg py-2.5 text-center transition duration-150 active:scale-[0.95] focus-visible:outline-none focus-visible:shadow-focus",
                      isSelected
                        ? "bg-white/[0.14] text-white ring-1 ring-inset ring-white/25"
                        : "text-muted hover:bg-white/[0.07] hover:text-text"
                    )}
                    key={option.value}
                    onClick={() => setSelectedDate(option.value)}
                    type="button"
                  >
                    <span className="text-[0.65rem] font-bold leading-none tracking-wide">
                      {weekday}.
                    </span>
                    <strong className="text-xl font-extrabold leading-none">{dayNumber}</strong>
                  </button>
                );
              })}
            </div>

            <button
              aria-label={t("schedule.nextDate")}
              className="flex items-center justify-center rounded-control border border-border px-2 text-muted transition duration-150 hover:border-brand hover:text-text active:scale-[0.92] focus-visible:outline-none focus-visible:shadow-focus disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100"
              disabled={!canGoNext}
              onClick={goToNextDate}
              type="button"
            >
              <ChevronRight className="size-4" />
            </button>

            <div className="relative">
              <button
                aria-label={t("schedule.openCalendar")}
                className="flex h-full items-center justify-center rounded-control border border-border px-2 text-muted transition duration-150 hover:border-brand hover:text-text active:scale-[0.92] focus-visible:outline-none focus-visible:shadow-focus"
                onClick={() => calendarInputRef.current?.showPicker?.()}
                type="button"
              >
                <CalendarDays className="size-4" />
              </button>
              <input
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 opacity-0"
                max={dateOptions[dateOptions.length - 1]?.value}
                min={dateOptions[0]?.value}
                onChange={handleCalendarChange}
                ref={calendarInputRef}
                tabIndex={-1}
                type="date"
                value={selectedDate}
              />
            </div>
          </div>

          <SessionSchedule
            date={selectedDate}
            onRetry={() => void loadSessions(selectedDate)}
            state={scheduleState}
          />
        </div>
      </div>

      {/* Em breve panel */}
      <div
        aria-labelledby={`${uid}-em_breve-tab`}
        hidden={activeTab !== "em_breve"}
        id={`${uid}-em_breve-panel`}
        role="tabpanel"
        tabIndex={0}
      >
        {upcoming.status === "error" ? (
          <StateMessage
            action={
              onRetryUpcoming ? (
                <Button onClick={onRetryUpcoming} variant="ghost">
                  {t("common.tryAgain")}
                </Button>
              ) : undefined
            }
            title={t("catalog.upcomingErrorTitle")}
            tone="error"
          >
            {upcoming.errorMessage ??
              t("catalog.sectionLoadError")}
          </StateMessage>
        ) : (
          <MovieCarousel
            emptyDescription={t("catalog.upcomingEmptyDescription")}
            emptyTitle={t("catalog.upcomingEmptyTitle")}
            isLoading={upcoming.status === "loading"}
            loadingLabel={t("catalog.upcomingLoading")}
            movies={upcoming.movies}
            title={t("domain.movieStatus.em_breve")}
            titleVisible={false}
          />
        )}
      </div>
    </section>
  );
}

export function SessionSchedule({
  date,
  onRetry,
  state,
}: {
  date: string;
  onRetry: () => void;
  state: SessionScheduleState;
}) {
  const { locale, t } = useI18n();

  if (state.status === "loading") {
    return (
      <StateMessage title={t("schedule.loadingTitle")} tone="loading">
        {t("schedule.loadingDescription", {
          date: formatSessionFullDate(date, locale),
        })}
      </StateMessage>
    );
  }

  if (state.status === "error") {
    return (
      <StateMessage
        action={
          <Button onClick={onRetry} variant="ghost">
            {t("common.tryAgain")}
          </Button>
        }
        title={t("schedule.errorTitle")}
        tone="error"
      >
        {state.errorMessage ??
          t("schedule.errorDescription")}
      </StateMessage>
    );
  }

  const purchasableSessions = state.sessions.filter(
    (s) => s.movie.status !== "em_breve"
  );
  const movieGroups = groupSessionsByMovie(purchasableSessions);

  if (movieGroups.length === 0) {
    return (
      <StateMessage title={t("schedule.emptyTitle")}>
        {t("schedule.emptyDescription", {
          date: formatSessionFullDate(date, locale),
        })}
      </StateMessage>
    );
  }

  return (
    <div aria-label={t("schedule.daySchedule")}>
      {movieGroups.map((group) => (
        <MovieScheduleEntry date={date} group={group} key={group.movie.id} />
      ))}
    </div>
  );
}

function MovieScheduleEntry({ date, group }: { date: string; group: MovieSessionGroup }) {
  const { locale, t } = useI18n();
  const allSessions = group.roomGroups.flatMap((rg) => rg.sessions);
  const experienceGroups = groupSessionsByExperienceType(allSessions, locale);

  return (
    <article className="flex gap-5 border-b border-white/10 py-8 first:pt-0 last:border-b-0 last:pb-0">
      <Link
        aria-hidden="true"
        className="shrink-0"
        href={getMovieDetailsHref(group.movie.id)}
        tabIndex={-1}
      >
        <ResponsiveImage
          alt={t("movie.posterAlt", { title: group.movie.title })}
          className="h-52 w-[8.5rem] rounded-control object-cover"
          height={312}
          loading="lazy"
          sizes="136px"
          src={group.movie.poster_url}
          unoptimized
          width={204}
        />
      </Link>

      <div className="grid min-w-0 content-start gap-3">
        <div className="grid gap-1">
          <Link
            className="text-xl font-extrabold leading-snug text-text hover:text-brand"
            href={getMovieDetailsHref(group.movie.id)}
          >
            {group.movie.title}
          </Link>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted">
            {group.movie.age_rating && (
              <span className="inline-flex items-center rounded border border-current px-1.5 py-px text-xs font-bold leading-none">
                {group.movie.age_rating}
              </span>
            )}
            <span>{formatMovieDuration(group.movie.duration_minutes, locale)}</span>
            <span aria-hidden="true">·</span>
            <span>{formatMovieGenres(group.movie.genres, locale)}</span>
          </div>
          {group.movie.director && (
            <p className="text-sm text-muted">
              <span className="font-semibold text-text">{t("movie.director")}:</span>{" "}
              {group.movie.director}
            </p>
          )}
          {group.movie.cast && group.movie.cast.length > 0 && (
            <p className="text-sm text-muted">
              <span className="font-semibold text-text">{t("movie.cast")}:</span>{" "}
              {group.movie.cast.slice(0, 3).join(", ")}
            </p>
          )}
        </div>

        <p className="text-sm font-extrabold capitalize text-text">
          {formatScheduleDateHeading(date, new Date(), locale)}
        </p>

        <div className="grid gap-4">
          {experienceGroups.map((expGroup) => (
            <ExperienceGroupEntry group={expGroup} key={expGroup.experienceType} />
          ))}
        </div>
      </div>
    </article>
  );
}

function ExperienceGroupEntry({ group }: { group: ExperienceSessionGroup }) {
  const { locale, t } = useI18n();
  const repSession = group.sessions[0];
  const allBadges = repSession ? getSessionBadges(repSession, locale) : [];
  const expLabel = getRoomExperienceLabel(repSession?.room.experience_type, locale);
  const headerBadges = allBadges.filter((b) => b.label !== expLabel);

  return (
    <div className="grid gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-sm font-bold text-text">{group.label}</h3>
        {headerBadges.length > 0 && <SessionBadgeList badges={headerBadges} />}
        <HelpCircle className="size-3.5 shrink-0 text-muted/50" />
      </div>
      <div className="flex flex-wrap gap-2">
        {group.sessions.map((session) => {
          const badges = getSessionBadges(session, locale);
          const badgeText = badges.map((b) => b.label).join(", ");
          const badgeDescription = badgeText
            ? t("schedule.badgeDescription", { badges: badgeText })
            : "";
          const purchasable = isSessionPurchasable(session);

          if (!purchasable) {
            return (
              <span
                aria-disabled="true"
                aria-label={t("schedule.sessionUnavailable", {
                  time: formatSessionTime(session.start_time, locale),
                })}
                className="flex min-w-[4.5rem] cursor-not-allowed items-center justify-center rounded-control bg-white/10 px-4 py-3 font-extrabold text-muted/60"
                key={session.id}
              >
                {formatSessionTime(session.start_time, locale)}
              </span>
            );
          }

          return (
            <Link
              aria-label={t("schedule.selectSession", {
                badges: badgeDescription,
                price: formatSessionPrice(session.base_price, locale),
                room: session.room.name,
                time: formatSessionTime(session.start_time, locale),
              })}
              className="flex min-w-[4.5rem] items-center justify-center rounded-control bg-brand px-4 py-3 font-extrabold text-white transition duration-150 hover:opacity-90 active:scale-[0.97] active:opacity-80 focus-visible:outline-none focus-visible:shadow-focus"
              href={getSessionSeatsHref(session.id)}
              key={session.id}
            >
              {formatSessionTime(session.start_time, locale)}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
