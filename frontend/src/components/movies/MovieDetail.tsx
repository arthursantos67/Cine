"use client";

import Link from "next/link";
import { CalendarDays, ChevronLeft, ChevronRight, HelpCircle } from "lucide-react";
import {
  type ChangeEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { ApiError, getApiErrorUserMessage } from "@/api/client";
import { catalogApi } from "@/api/catalog";
import { ResponsiveImage } from "@/components/ui/ResponsiveImage";
import { StateMessage } from "@/components/ui/StateMessage";
import type { CatalogMovieDetail, CatalogSession } from "@/types/catalog";

import {
  formatMovieDuration,
  formatMovieGenres,
  formatMovieReleaseDate,
} from "./movie-formatters";
import { SessionBadgeList } from "./SessionBadges";
import {
  buildSessionDateOptions,
  formatScheduleDateHeading,
  formatSessionFullDate,
  formatSessionPrice,
  formatSessionTime,
  getSessionSeatsHref,
  getSessionBadges,
  groupSessionsByRoom,
} from "./session-selection";

type MovieDetailStatus = "error" | "loading" | "not-found" | "success";
type SessionListStatus = "error" | "loading" | "success";

export type MovieDetailState = {
  errorMessage?: string;
  movie?: CatalogMovieDetail;
  status: MovieDetailStatus;
};

type SessionListState = {
  errorMessage?: string;
  sessions: CatalogSession[];
  status: SessionListStatus;
};

type MovieDetailProps = {
  movieId: string;
};

type MovieDetailViewProps = {
  onRetry?: () => void;
  state: MovieDetailState;
};

const loadingState: MovieDetailState = {
  status: "loading",
};

export function MovieDetail({ movieId }: MovieDetailProps) {
  const [state, setState] = useState<MovieDetailState>(loadingState);

  const loadMovie = useCallback(async () => {
    const trimmedMovieId = movieId.trim();

    if (!trimmedMovieId) {
      setState({ status: "not-found" });
      return;
    }

    setState(loadingState);

    try {
      const movie = await catalogApi.getMovie(trimmedMovieId);

      setState(
        movie?.id
          ? {
              movie,
              status: "success",
            }
          : { status: "not-found" }
      );
    } catch (error) {
      setState(toMovieDetailErrorState(error));
    }
  }, [movieId]);

  useEffect(() => {
    void loadMovie();
  }, [loadMovie]);

  return (
    <MovieDetailView
      onRetry={() => void loadMovie()}
      state={state}
    />
  );
}

export function MovieDetailView({ onRetry, state }: MovieDetailViewProps) {
  if (state.status === "loading") {
    return <MovieDetailLoadingState />;
  }

  if (state.status === "error") {
    return (
      <StateMessage
        action={
          onRetry ? (
            <button className="button button-ghost" onClick={onRetry} type="button">
              Tentar novamente
            </button>
          ) : undefined
        }
        title="Detalhes indisponíveis"
        tone="error"
      >
        {state.errorMessage ??
          "Não conseguimos carregar este filme agora. Tente novamente em instantes."}
      </StateMessage>
    );
  }

  if (state.status === "not-found" || !state.movie) {
    return <MovieDetailNotFoundState />;
  }

  return <MovieDetailSuccess movie={state.movie} />;
}

function MovieDetailSuccess({ movie }: { movie: CatalogMovieDetail }) {
  const ageRating = movie.age_rating
    ? movie.age_rating === "L"
      ? "L"
      : movie.age_rating
    : null;
  const genres = formatMovieGenres(movie.genres);
  const duration = formatMovieDuration(movie.duration_minutes);
  const releaseDate = formatMovieReleaseDate(movie.release_date);

  return (
    <div className="movie-detail">
      <div className="movie-detail__poster-frame">
        {movie.poster_url ? (
          <ResponsiveImage
            alt={`Poster de ${movie.title}`}
            className="movie-detail__poster"
            height={720}
            priority
            src={movie.poster_url}
            sizes="(max-width: 820px) 100vw, 340px"
            unoptimized
            width={480}
          />
        ) : (
          <div
            aria-label={`Poster indisponível de ${movie.title}`}
            className="movie-detail__poster-placeholder"
            role="img"
          >
            Poster indisponível
          </div>
        )}
      </div>

      <article className="movie-detail__content">
        <div className="movie-detail__heading">
          <p className="eyebrow">Filme</p>
          <h1>{movie.title}</h1>
        </div>

        <div className="movie-detail__metadata" aria-label="Informações do filme">
          {ageRating ? (
            <span className="movie-detail__rating">{ageRating}</span>
          ) : null}
          <span>{duration}</span>
          <span aria-hidden="true">·</span>
          <span>{genres}</span>
          {movie.release_date ? (
            <>
              <span aria-hidden="true">·</span>
              <span>Estreia {releaseDate}</span>
            </>
          ) : null}
        </div>

        {(movie.director || (movie.cast && movie.cast.length > 0)) && (
          <div className="movie-detail__credits">
            {movie.director && (
              <p>
                <strong>Direção:</strong> {movie.director}
              </p>
            )}
            {movie.cast && movie.cast.length > 0 && (
              <p>
                <strong>Elenco:</strong> {movie.cast.join(", ")}
              </p>
            )}
          </div>
        )}

        <section className="movie-detail__synopsis" aria-labelledby="sinopse">
          <h2 id="sinopse">Sinopse</h2>
          <p>{movie.synopsis || "Sinopse indisponível."}</p>
        </section>

        {movie.status === "em_breve" ? (
          <MovieComingSoonNotice />
        ) : (
          <MovieSessionSelector movieId={movie.id} />
        )}
      </article>
    </div>
  );
}

function MovieComingSoonNotice() {
  return (
    <StateMessage title="Em breve nas telas">
      Este filme ainda não está em cartaz. Fique de olho na programação para saber quando as
      sessões estarão disponíveis.
    </StateMessage>
  );
}

function MovieSessionSelector({ movieId }: { movieId: string }) {
  const dateOptions = useMemo(() => buildSessionDateOptions(new Date()), []);
  const [selectedDate, setSelectedDate] = useState(dateOptions[0]?.value ?? "");
  const calendarInputRef = useRef<HTMLInputElement>(null);
  const dateRailRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<SessionListState>({
    sessions: [],
    status: "loading",
  });

  const loadSessions = useCallback(async () => {
    if (!selectedDate) {
      setState({ sessions: [], status: "success" });
      return;
    }

    setState({ sessions: [], status: "loading" });

    try {
      const response = await catalogApi.getSessions({
        date: selectedDate,
        movie: movieId,
      });

      setState({
        sessions: response.results,
        status: "success",
      });
    } catch (error) {
      setState({
        errorMessage: getApiErrorUserMessage(error),
        sessions: [],
        status: "error",
      });
    }
  }, [movieId, selectedDate]);

  useEffect(() => {
    let isActive = true;

    async function fetchSessions() {
      if (!selectedDate) {
        if (isActive) {
          setState({ sessions: [], status: "success" });
        }
        return;
      }

      setState({ sessions: [], status: "loading" });

      try {
        const response = await catalogApi.getSessions({
          date: selectedDate,
          movie: movieId,
        });

        if (isActive) {
          setState({
            sessions: response.results,
            status: "success",
          });
        }
      } catch (error) {
        if (isActive) {
          setState({
            errorMessage: getApiErrorUserMessage(error),
            sessions: [],
            status: "error",
          });
        }
      }
    }

    void fetchSessions();

    return () => {
      isActive = false;
    };
  }, [movieId, selectedDate]);

  useEffect(() => {
    const selectedButton = dateRailRef.current?.querySelector<HTMLButtonElement>(
      `[data-session-date="${selectedDate}"]`
    );

    selectedButton?.scrollIntoView({
      block: "nearest",
      inline: "center",
      behavior: "smooth",
    });
  }, [selectedDate]);

  const selectedDateIdx = dateOptions.findIndex(
    (dateOption) => dateOption.value === selectedDate
  );
  const canGoPrev = selectedDateIdx > 0;
  const canGoNext = selectedDateIdx < dateOptions.length - 1;

  function goToPrevDate() {
    if (canGoPrev) {
      setSelectedDate(dateOptions[selectedDateIdx - 1].value);
    }
  }

  function goToNextDate() {
    if (canGoNext) {
      setSelectedDate(dateOptions[selectedDateIdx + 1].value);
    }
  }

  function handleCalendarChange(event: ChangeEvent<HTMLInputElement>) {
    const pickedDate = event.target.value;
    const matchingDate = dateOptions.find(
      (dateOption) => dateOption.value === pickedDate
    );

    if (matchingDate) {
      setSelectedDate(matchingDate.value);
    }
  }

  function openCalendarPicker() {
    const calendarInput = calendarInputRef.current;

    if (!calendarInput) {
      return;
    }

    if (typeof calendarInput.showPicker === "function") {
      calendarInput.showPicker();
      return;
    }

    calendarInput.click();
  }

  return (
    <section
      aria-labelledby="selecionar-sessao"
      className="movie-detail__sessions"
    >
      <div className="movie-detail__sessions-header">
        <h2 id="selecionar-sessao">Sessões</h2>
        <p>{formatSessionFullDate(selectedDate)}</p>
      </div>

      <div
        aria-label="Selecionar data"
        className="session-date-carousel"
        role="group"
      >
        <button
          aria-label="Data anterior"
          className="session-date-carousel__nav"
          disabled={!canGoPrev}
          onClick={goToPrevDate}
          type="button"
        >
          <ChevronLeft aria-hidden="true" size={18} />
        </button>

        <div
          aria-label="Datas disponíveis"
          className="session-date-selector"
          ref={dateRailRef}
        >
          {dateOptions.map((dateOption) => {
            const isSelected = dateOption.value === selectedDate;
            const dayNumber = dateOption.label.split("/")[0];

            return (
              <button
                aria-label={`${dateOption.weekday}, ${formatSessionFullDate(dateOption.value)}`}
                aria-pressed={isSelected}
                className="session-date-selector__button"
                data-session-date={dateOption.value}
                key={dateOption.value}
                onClick={() => setSelectedDate(dateOption.value)}
                type="button"
              >
                <span>{dateOption.weekday}</span>
                <strong>{dayNumber}</strong>
              </button>
            );
          })}
        </div>

        <button
          aria-label="Próxima data"
          className="session-date-carousel__nav"
          disabled={!canGoNext}
          onClick={goToNextDate}
          type="button"
        >
          <ChevronRight aria-hidden="true" size={18} />
        </button>

        <div className="session-date-carousel__calendar">
          <button
            aria-label="Abrir calendário"
            className="session-date-carousel__nav"
            onClick={openCalendarPicker}
            type="button"
          >
            <CalendarDays aria-hidden="true" size={18} />
          </button>
          <input
            aria-hidden="true"
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

      <SessionList
        date={selectedDate}
        onRetry={() => void loadSessions()}
        state={state}
      />
    </section>
  );
}

export function SessionList({
  date,
  onRetry,
  state,
}: {
  date: string;
  onRetry: () => void;
  state: SessionListState;
}) {
  if (state.status === "loading") {
    return (
      <StateMessage tone="loading" title="Carregando sessões">
        Buscando horários para {formatSessionFullDate(date)}.
      </StateMessage>
    );
  }

  if (state.status === "error") {
    return (
      <StateMessage
        action={
          <button className="button button-ghost" onClick={onRetry} type="button">
            Tentar novamente
          </button>
        }
        title="Sessões indisponíveis"
        tone="error"
      >
        {state.errorMessage ??
          "Não conseguimos carregar as sessões agora. Tente novamente em instantes."}
      </StateMessage>
    );
  }

  if (state.sessions.length === 0) {
    return (
      <StateMessage title="Nenhuma sessão nesta data">
        Não há sessões disponíveis para {formatSessionFullDate(date)}. Escolha outra
        data.
      </StateMessage>
    );
  }

  const groups = groupSessionsByRoom(state.sessions);

  return (
    <div aria-label="Sessões disponíveis" className="session-list">
      <p className="session-list__date-heading">
        {formatScheduleDateHeading(date)}
      </p>
      {groups.map((group) => (
        <section className="session-room-group" key={group.roomId}>
          <div className="session-room-group__heading">
            <div>
              <h3>{group.roomName}</h3>
              {group.sessions[0] ? (
                <SessionBadgeList badges={getSessionBadges(group.sessions[0])} />
              ) : null}
            </div>
            <HelpCircle aria-hidden="true" size={16} />
          </div>
          <div className="session-time-grid">
            {group.sessions.map((session) => {
              const badges = getSessionBadges(session);
              const badgeText = badges.map((badge) => badge.label).join(", ");
              const badgeDescription = badgeText
                ? `, formatos ${badgeText}`
                : "";

              return (
                <Link
                  aria-label={`Selecionar sessão das ${formatSessionTime(
                    session.start_time
                  )}, sala ${group.roomName}${badgeDescription}, valor ${formatSessionPrice(
                    session.base_price
                  )}`}
                  className="session-option"
                  href={getSessionSeatsHref(session.id)}
                  key={session.id}
                >
                  <strong>{formatSessionTime(session.start_time)}</strong>
                  <span className="sr-only">
                    até {formatSessionTime(session.end_time)},{" "}
                    {formatSessionPrice(session.base_price)}
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

function MovieDetailLoadingState() {
  return (
    <div aria-busy="true" className="movie-detail-loading" role="status">
      <div className="movie-detail-loading__poster" />
      <div className="movie-detail-loading__content">
        <span>Carregando detalhes do filme...</span>
        <span className="skeleton-line skeleton-line--title" />
        <span className="skeleton-line" />
        <span className="skeleton-line skeleton-line--short" />
        <span className="skeleton-line" />
      </div>
    </div>
  );
}

function MovieDetailNotFoundState() {
  return (
    <StateMessage title="Filme não encontrado">
      Não encontramos esse filme no catálogo. Volte para a página inicial e escolha
      outro título disponível.
    </StateMessage>
  );
}

function toMovieDetailErrorState(error: unknown): MovieDetailState {
  if (error instanceof ApiError && error.code === "RESOURCE_NOT_FOUND") {
    return { status: "not-found" };
  }

  return {
    errorMessage: getApiErrorUserMessage(error),
    status: "error",
  };
}
