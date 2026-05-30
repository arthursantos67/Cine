"use client";

import Link from "next/link";
import { type KeyboardEvent, useCallback, useEffect, useId, useMemo, useState } from "react";

import { catalogApi } from "@/api/catalog";
import type { MovieSectionState } from "@/app/HomeCatalog";
import { Button } from "@/components/ui/Button";
import { cn } from "@/components/ui/classNames";
import { ResponsiveImage } from "@/components/ui/ResponsiveImage";
import { StateMessage } from "@/components/ui/StateMessage";
import type { CatalogSession } from "@/types/catalog";

import { MovieCarousel } from "./MovieCarousel";
import {
  formatMovieDuration,
  formatMovieGenres,
  getMovieDetailsHref,
} from "./movie-formatters";
import { SessionBadgeList } from "./SessionBadges";
import {
  buildSessionDateOptions,
  formatSessionFullDate,
  formatSessionPrice,
  formatSessionTime,
  getSessionBadges,
  getSessionSeatsHref,
  groupSessionsByMovie,
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
  { value: "em_cartaz" as ScheduleTab, label: "Em cartaz" },
  { value: "em_breve" as ScheduleTab, label: "Em breve" },
] as const;

export function HomeSchedule({
  cinemaName = "CinePrime Natal",
  onRetryUpcoming,
  upcoming,
}: HomeScheduleProps) {
  const [activeTab, setActiveTab] = useState<ScheduleTab>("em_cartaz");
  const uid = useId();
  const headingId = `${uid}-schedule-heading`;

  const dateOptions = useMemo(() => buildSessionDateOptions(new Date()), []);
  const [selectedDate, setSelectedDate] = useState(dateOptions[0]?.value ?? "");
  const [scheduleState, setScheduleState] = useState<SessionScheduleState>({
    sessions: [],
    status: "loading",
  });

  const loadSessions = useCallback(async (date: string) => {
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
        errorMessage:
          "Não conseguimos carregar a programação agora. Verifique sua conexão e tente novamente.",
        sessions: [],
        status: "error",
      });
    }
  }, []);

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
      const tabList = e.currentTarget.parentElement;
      (tabList?.children[nextIdx] as HTMLElement | undefined)?.focus();
    }
  }

  return (
    <section
      aria-labelledby={headingId}
      className="grid gap-5 rounded-panel border border-border bg-surface p-6 shadow-soft max-sm:p-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2
          className="text-[length:var(--text-section)] font-extrabold leading-[var(--text-section--line-height)] text-text"
          id={headingId}
        >
          Horários
        </h2>
        <span className="text-sm font-bold text-muted">{cinemaName}</span>
      </div>

      <div
        aria-label="Seções de horários"
        className="inline-flex w-fit max-w-full gap-1 overflow-x-auto rounded-panel border border-border bg-surface-muted p-1"
        role="tablist"
      >
        {SCHEDULE_TABS.map((tab, idx) => {
          const isSelected = activeTab === tab.value;
          return (
            <button
              aria-controls={`${uid}-${tab.value}-panel`}
              aria-selected={isSelected}
              className={cn(
                "min-h-9 whitespace-nowrap rounded-control px-3 py-2 text-sm font-extrabold transition-colors duration-150 focus-visible:outline-none focus-visible:shadow-focus",
                isSelected
                  ? "bg-surface text-text shadow-soft"
                  : "text-muted hover:bg-surface hover:text-text"
              )}
              id={`${uid}-${tab.value}-tab`}
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              onKeyDown={(e) => handleTabKeyDown(e, idx)}
              role="tab"
              tabIndex={isSelected ? 0 : -1}
              type="button"
            >
              {tab.label}
            </button>
          );
        })}
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
          <div
            aria-label="Selecionar data"
            className="flex gap-2 overflow-x-auto pb-1"
            role="group"
          >
            {dateOptions.map((option) => (
              <button
                aria-pressed={option.value === selectedDate}
                className={cn(
                  "flex min-w-[3.25rem] flex-col items-center gap-0.5 rounded-control border px-2.5 py-2 text-center text-xs font-bold transition-colors focus-visible:outline-none focus-visible:shadow-focus",
                  option.value === selectedDate
                    ? "border-brand bg-brand text-white"
                    : "border-border bg-surface-muted text-muted hover:border-brand hover:text-text"
                )}
                key={option.value}
                onClick={() => setSelectedDate(option.value)}
                type="button"
              >
                <span className="capitalize">{option.weekday}</span>
                <strong>{option.label}</strong>
              </button>
            ))}
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
                  Tentar novamente
                </Button>
              ) : undefined
            }
            title="Em breve indisponível"
            tone="error"
          >
            {upcoming.errorMessage ??
              "Não conseguimos carregar esta seção agora. Verifique sua conexão e tente novamente."}
          </StateMessage>
        ) : (
          <MovieCarousel
            emptyDescription="Ainda não há filmes em breve no catálogo."
            emptyTitle="Nenhum filme em breve"
            isLoading={upcoming.status === "loading"}
            loadingLabel="Carregando filmes em breve..."
            movies={upcoming.movies}
            title="Em breve"
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
  if (state.status === "loading") {
    return (
      <StateMessage title="Carregando programação" tone="loading">
        Buscando sessões para {formatSessionFullDate(date)}.
      </StateMessage>
    );
  }

  if (state.status === "error") {
    return (
      <StateMessage
        action={
          <Button onClick={onRetry} variant="ghost">
            Tentar novamente
          </Button>
        }
        title="Programação indisponível"
        tone="error"
      >
        {state.errorMessage ??
          "Não conseguimos carregar a programação agora. Tente novamente em instantes."}
      </StateMessage>
    );
  }

  const purchasableSessions = state.sessions.filter(
    (s) => s.movie.status !== "em_breve"
  );
  const movieGroups = groupSessionsByMovie(purchasableSessions);

  if (movieGroups.length === 0) {
    return (
      <StateMessage title="Nenhuma sessão nesta data">
        Não há sessões disponíveis para {formatSessionFullDate(date)}. Escolha outra data.
      </StateMessage>
    );
  }

  return (
    <div aria-label="Programação do dia">
      {movieGroups.map((group) => (
        <MovieScheduleEntry group={group} key={group.movie.id} />
      ))}
    </div>
  );
}

function MovieScheduleEntry({ group }: { group: MovieSessionGroup }) {
  return (
    <article className="grid grid-cols-[auto_1fr] gap-4 border-b border-border py-5 first:pt-0 last:border-b-0 last:pb-0">
      <Link
        aria-hidden="true"
        className="shrink-0"
        href={getMovieDetailsHref(group.movie.id)}
        tabIndex={-1}
      >
        <ResponsiveImage
          alt={`Poster de ${group.movie.title}`}
          className="h-24 w-16 rounded-control object-cover"
          height={144}
          loading="lazy"
          sizes="64px"
          src={group.movie.poster_url}
          unoptimized
          width={96}
        />
      </Link>

      <div className="grid gap-3">
        <div>
          <Link
            className="font-extrabold leading-snug text-text hover:text-brand"
            href={getMovieDetailsHref(group.movie.id)}
          >
            {group.movie.title}
          </Link>
          <p className="mt-0.5 text-sm text-muted">
            {formatMovieGenres(group.movie.genres)}
            {" · "}
            {formatMovieDuration(group.movie.duration_minutes)}
          </p>
        </div>

        {group.roomGroups.map((roomGroup) => (
          <div className="grid gap-1.5" key={roomGroup.roomId}>
            <h3 className="text-sm font-bold text-text">{roomGroup.roomName}</h3>
            <div className="flex flex-wrap gap-2">
              {roomGroup.sessions.map((session) => {
                const badges = getSessionBadges(session);
                const badgeText = badges.map((b) => b.label).join(", ");
                const badgeDescription = badgeText ? `, formatos ${badgeText}` : "";

                return (
                  <Link
                    aria-label={`Selecionar sessão das ${formatSessionTime(session.start_time)}, sala ${roomGroup.roomName}${badgeDescription}, valor ${formatSessionPrice(session.base_price)}`}
                    className="flex flex-col items-start gap-1 rounded-control border border-border bg-surface-muted px-3 py-2 text-left text-sm transition-colors hover:border-brand hover:bg-surface focus-visible:outline-none focus-visible:shadow-focus"
                    href={getSessionSeatsHref(session.id)}
                    key={session.id}
                  >
                    <strong className="text-text">{formatSessionTime(session.start_time)}</strong>
                    <span className="text-xs text-muted">
                      até {formatSessionTime(session.end_time)}
                    </span>
                    {badges.length > 0 && <SessionBadgeList badges={badges} />}
                    <span className="text-xs font-bold text-muted">
                      {formatSessionPrice(session.base_price)}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}
