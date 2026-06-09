"use client";

import { useCallback, useEffect, useState } from "react";

import { catalogApi } from "@/api/catalog";
import { Button } from "@/components/ui/Button";
import { FeaturedMovieBanner } from "@/components/movies";
import { HomeSchedule } from "@/components/movies/HomeSchedule";
import { TabbedMovieCatalog } from "@/components/movies/TabbedMovieCatalog";
import { StateMessage } from "@/components/ui/StateMessage";
import type { CatalogMovie } from "@/types/catalog";
import { useI18n } from "@/i18n";

type SectionStatus = "error" | "loading" | "success";

export type MovieSectionState = {
  errorMessage?: string;
  movies: CatalogMovie[];
  status: SectionStatus;
};

type HomeCatalogSectionsProps = {
  featured: MovieSectionState;
  nowShowing: MovieSectionState;
  onRetryFeatured?: () => void;
  onRetryNowShowing?: () => void;
  onRetryPreSale?: () => void;
  onRetryUpcoming?: () => void;
  preSale: MovieSectionState;
  upcoming: MovieSectionState;
};

const loadingSectionState: MovieSectionState = {
  movies: [],
  status: "loading",
};

export function HomeCatalog() {
  const { locale } = useI18n();
  const [featured, setFeatured] =
    useState<MovieSectionState>(loadingSectionState);
  const [nowShowing, setNowShowing] =
    useState<MovieSectionState>(loadingSectionState);
  const [preSale, setPreSale] = useState<MovieSectionState>(loadingSectionState);
  const [upcoming, setUpcoming] = useState<MovieSectionState>(loadingSectionState);

  const loadFeatured = useCallback(async () => {
    await loadMovieSection(
      () => catalogApi.listFeaturedMovies(),
      setFeatured
    );
  }, []);

  const loadNowShowing = useCallback(async () => {
    await loadMovieSection(
      () => catalogApi.listNowShowingMovies(),
      setNowShowing
    );
  }, []);

  const loadPreSale = useCallback(async () => {
    await loadMovieSection(() => catalogApi.listPreSaleMovies(), setPreSale);
  }, []);

  const loadUpcoming = useCallback(async () => {
    await loadMovieSection(() => catalogApi.listUpcomingMovies(), setUpcoming);
  }, []);

  useEffect(() => {
    void locale;
    void loadFeatured();
    void loadNowShowing();
    void loadPreSale();
    void loadUpcoming();
  }, [loadFeatured, loadNowShowing, loadPreSale, loadUpcoming, locale]);

  return (
    <HomeCatalogSections
      featured={featured}
      nowShowing={nowShowing}
      onRetryFeatured={() => void loadFeatured()}
      onRetryNowShowing={() => void loadNowShowing()}
      onRetryPreSale={() => void loadPreSale()}
      onRetryUpcoming={() => void loadUpcoming()}
      preSale={preSale}
      upcoming={upcoming}
    />
  );
}

export function HomeCatalogSections({
  featured,
  nowShowing,
  onRetryFeatured,
  onRetryNowShowing,
  onRetryPreSale,
  onRetryUpcoming,
  preSale,
  upcoming,
}: HomeCatalogSectionsProps) {
  const { t } = useI18n();

  return (
    <div>
      {/* Cinematic hero area — full-bleed, full-height */}
      {featured.status === "loading" ? (
        <div
          aria-busy="true"
          className="relative overflow-hidden text-white ml-[calc(50%_-_50vw)] mr-[calc(50%_-_50vw)] w-screen mt-[calc(-1_*_var(--layout-page-block))] bg-[rgb(8_10_16)] h-[75svh] min-h-[400px] flex items-center justify-center"
        >
          <div className="shell-container">
            <StateMessage title={t("home.featuredLoadingTitle")} tone="loading">
              {t("home.featuredLoadingDescription")}
            </StateMessage>
          </div>
        </div>
      ) : null}

      {featured.status === "error" ? (
        <div className="relative overflow-hidden text-white ml-[calc(50%_-_50vw)] mr-[calc(50%_-_50vw)] w-screen mt-[calc(-1_*_var(--layout-page-block))] bg-[rgb(8_10_16)] h-[75svh] min-h-[400px] flex items-center justify-center">
          <div className="shell-container">
            <CatalogErrorState
              message={
                featured.errorMessage ??
                t("home.featuredErrorDescription")
              }
              onRetry={onRetryFeatured}
              title={t("home.featuredErrorTitle")}
            />
          </div>
        </div>
      ) : null}

      {featured.status === "success" && featured.movies.length === 0 ? (
        <div
          aria-hidden="true"
          className="ml-[calc(50%_-_50vw)] mr-[calc(50%_-_50vw)] w-screen mt-[calc(-1_*_var(--layout-page-block))] bg-[rgb(8_10_16)] min-h-[320px]"
        />
      ) : null}

      {featured.status === "success" && featured.movies.length > 0 ? (
        <FeaturedMovieBanner
          movies={featured.movies}
          primaryActionLabel={t("movie.viewDetails")}
        />
      ) : null}

      {/* Catalog sections — anchored for scroll-to-catalog links */}
      <div
        className="grid gap-7 pt-[var(--layout-page-block)] max-md:pt-[var(--layout-page-block-compact)]"
        id="catalogo"
      >
        <TabbedMovieCatalog
          nowShowing={nowShowing}
          onRetryNowShowing={onRetryNowShowing}
          onRetryPreSale={onRetryPreSale}
          preSale={preSale}
        />

        <HomeSchedule
          onRetryUpcoming={onRetryUpcoming}
          upcoming={upcoming}
        />
      </div>
    </div>
  );
}

async function loadMovieSection(
  requestMovies: () => Promise<{ results: CatalogMovie[] }>,
  setSection: (state: MovieSectionState) => void
) {
  setSection(loadingSectionState);

  try {
    const response = await requestMovies();
    setSection({
      movies: response.results,
      status: "success",
    });
  } catch {
    setSection({
      errorMessage: undefined,
      movies: [],
      status: "error",
    });
  }
}

function CatalogErrorState({
  message,
  onRetry,
  title,
}: {
  message: string;
  onRetry?: () => void;
  title: string;
}) {
  const { t } = useI18n();

  return (
    <StateMessage
      action={
        onRetry ? (
          <Button onClick={onRetry} variant="ghost">
            {t("common.tryAgain")}
          </Button>
        ) : undefined
      }
      title={title}
      tone="error"
    >
      {message}
    </StateMessage>
  );
}
