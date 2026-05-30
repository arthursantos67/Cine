"use client";

import { MapPin } from "lucide-react";
import { Fragment, type KeyboardEvent, useId, useState } from "react";

import type { MovieSectionState } from "@/app/HomeCatalog";
import { Button } from "@/components/ui/Button";
import { StateMessage } from "@/components/ui/StateMessage";
import { cn } from "@/components/ui/classNames";

import { MovieCarousel } from "./MovieCarousel";

type CatalogTab = "em_cartaz" | "pre_venda";

type TabbedMovieCatalogProps = {
  cinemaName?: string;
  nowShowing: MovieSectionState;
  onRetryNowShowing?: () => void;
  onRetryPreSale?: () => void;
  preSale: MovieSectionState;
};

const TABS = [
  {
    value: "em_cartaz" as CatalogTab,
    label: "Em cartaz",
    emptyTitle: "Nenhum filme em cartaz",
    emptyDescription: "Ainda não há filmes em cartaz no catálogo.",
    loadingLabel: "Carregando filmes em cartaz...",
    errorTitle: "Em cartaz indisponível",
  },
  {
    value: "pre_venda" as CatalogTab,
    label: "Pré-venda",
    emptyTitle: "Nenhum filme em pré-venda",
    emptyDescription: "Ainda não há filmes em pré-venda no catálogo.",
    loadingLabel: "Carregando filmes em pré-venda...",
    errorTitle: "Pré-venda indisponível",
  },
] as const;

export function TabbedMovieCatalog({
  cinemaName = "CinePrime Natal",
  nowShowing,
  onRetryNowShowing,
  onRetryPreSale,
  preSale,
}: TabbedMovieCatalogProps) {
  const [activeTab, setActiveTab] = useState<CatalogTab>("em_cartaz");
  const uid = useId();

  function handleTabKeyDown(e: KeyboardEvent<HTMLButtonElement>, idx: number) {
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      e.preventDefault();
      const nextIdx =
        e.key === "ArrowRight"
          ? (idx + 1) % TABS.length
          : (idx - 1 + TABS.length) % TABS.length;
      setActiveTab(TABS[nextIdx].value);
      const tabList = e.currentTarget.closest('[role="tablist"]');
      const tabs = tabList?.querySelectorAll<HTMLElement>('[role="tab"]');
      tabs?.[nextIdx]?.focus();
    }
  }

  function getSectionForTab(tab: (typeof TABS)[number]) {
    return tab.value === "em_cartaz" ? nowShowing : preSale;
  }

  function getRetryForTab(tab: (typeof TABS)[number]) {
    return tab.value === "em_cartaz" ? onRetryNowShowing : onRetryPreSale;
  }

  return (
    <section aria-label="Programação" className="grid gap-0.5">
      {/* Tab list + location */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          aria-label="Seções de programação"
          className="flex items-center"
          role="tablist"
        >
        {TABS.map((tab, idx) => {
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
                {tab.label}
              </button>
            </Fragment>
          );
        })}
        </div>
        <CinemaIndicator name={cinemaName} />
      </div>

      {/* Tab panels */}
      {TABS.map((tab) => {
        const section = getSectionForTab(tab);
        const onRetry = getRetryForTab(tab);

        return (
          <div
            aria-labelledby={`${uid}-${tab.value}-tab`}
            hidden={activeTab !== tab.value}
            id={`${uid}-${tab.value}-panel`}
            key={tab.value}
            role="tabpanel"
            tabIndex={0}
          >
            {section.status === "error" ? (
              <CatalogErrorState
                message={
                  section.errorMessage ??
                  "Não conseguimos carregar esta seção agora. Verifique sua conexão e tente novamente."
                }
                onRetry={onRetry}
                title={tab.errorTitle}
              />
            ) : (
              <MovieCarousel
                emptyDescription={tab.emptyDescription}
                emptyTitle={tab.emptyTitle}
                isLoading={section.status === "loading"}
                loadingLabel={tab.loadingLabel}
                movies={section.movies}
                title={tab.label}
                titleVisible={false}
              />
            )}
          </div>
        );
      })}
    </section>
  );
}

function CinemaIndicator({ name }: { name: string }) {
  return (
    <div className="flex items-center gap-1.5 text-sm font-bold text-muted">
      <MapPin aria-hidden="true" className="shrink-0" size={14} strokeWidth={2.5} />
      <span>{name}</span>
    </div>
  );
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
  return (
    <StateMessage
      action={
        onRetry ? (
          <Button onClick={onRetry} variant="ghost">
            Tentar novamente
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
