import Link from "next/link";

import { StateMessage } from "@/components/ui/StateMessage";
import { cn } from "@/components/ui/classNames";
import type { TicketFilterType, UserTicket } from "@/types/ticket";

import { TicketCard as SharedTicketCard } from "./TicketCard";

export type MyTicketsStatus = "error" | "loading" | "success";

export type MyTicketsContentProps = {
  activeFilter: TicketFilterType | null;
  errorMessage?: string;
  onRetry?: () => void;
  status: MyTicketsStatus;
  tickets: UserTicket[];
};

const filterOptions: Array<{
  href: string;
  label: string;
  value: TicketFilterType | null;
}> = [
  { href: "/my-tickets", label: "Todos", value: null },
  { href: "/my-tickets?type=upcoming", label: "Próximos", value: "upcoming" },
  { href: "/my-tickets?type=past", label: "Anteriores", value: "past" },
];

export function MyTicketsContent({
  activeFilter,
  errorMessage,
  onRetry,
  status,
  tickets,
}: MyTicketsContentProps) {
  return (
    <section aria-labelledby="meus-ingressos" className="my-tickets grid gap-4">
      <div className="my-tickets__toolbar grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 rounded-card border border-white/10 bg-[linear-gradient(180deg,rgb(255_255_255_/_5%),rgb(255_255_255_/_2%))] p-5 text-text shadow-[0_18px_54px_rgb(0_0_0_/_18%)] max-lg:grid-cols-1">
        <div>
          <h2
            className="m-0 text-[21px] leading-tight text-white"
            id="meus-ingressos"
          >
            Ingressos da sua conta
          </h2>
          <p className="m-0 mt-1.5 leading-6 text-text/65">
            {filterDescriptionLabels[activeFilter ?? "all"]}
          </p>
        </div>

        <nav
          aria-label="Filtros de ingressos"
          className="my-tickets__filters flex flex-wrap items-center justify-end gap-2 max-lg:justify-start"
        >
          {filterOptions.map((option) => {
            const isActive = option.value === activeFilter;

            return (
              <Link
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "inline-flex min-h-10 items-center justify-center rounded-md border px-3.5 text-sm font-extrabold leading-none transition",
                  isActive
                    ? "border-accent bg-cinema-gold-soft text-[#3a2b00] hover:bg-accent"
                    : "border-white/15 bg-transparent text-text hover:bg-white/10"
                )}
                href={option.href}
                key={option.label}
              >
                {option.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {status === "loading" ? (
        <StateMessage tone="loading" title="Carregando ingressos">
          Aguarde enquanto buscamos seus ingressos.
        </StateMessage>
      ) : null}

      {status === "error" ? (
        <StateMessage
          action={
            onRetry ? (
              <button
                className="inline-flex min-h-10 items-center justify-center rounded-md border border-brand bg-brand px-3.5 text-sm font-extrabold leading-none text-white transition hover:bg-brand-strong"
                onClick={onRetry}
                type="button"
              >
                Tentar novamente
              </button>
            ) : null
          }
          tone="error"
          title="Ingressos indisponíveis"
        >
          {errorMessage ?? "Não foi possível carregar seus ingressos agora."}
        </StateMessage>
      ) : null}

      {status === "success" && tickets.length === 0 ? (
        <StateMessage title={emptyStateLabels[activeFilter ?? "all"].title}>
          {emptyStateLabels[activeFilter ?? "all"].description}
        </StateMessage>
      ) : null}

      {status === "success" && tickets.length > 0 ? (
        <div className="my-tickets__list grid gap-3" role="list">
          {tickets.map((ticket) => (
            <div key={ticket.ticket_id} role="listitem">
              <TicketCard ticket={ticket} />
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}

export function TicketCard({ ticket }: { ticket: UserTicket }) {
  return <SharedTicketCard showVisualCode={false} ticket={ticket} />;
}

export function getTicketFilterFromSearchParams(
  searchParams: Pick<URLSearchParams, "get">
): TicketFilterType | null {
  const type = searchParams.get("type");

  if (type === "upcoming" || type === "past") {
    return type;
  }

  return null;
}

const filterDescriptionLabels: Record<TicketFilterType | "all", string> = {
  all: "Veja todos os ingressos comprados.",
  past: "Exibindo sessões que já aconteceram.",
  upcoming: "Exibindo sessões futuras.",
};

const emptyStateLabels: Record<
  TicketFilterType | "all",
  { description: string; title: string }
> = {
  all: {
    description:
      "Quando você finalizar uma compra, seus ingressos aparecerão aqui.",
    title: "Você ainda não tem ingressos",
  },
  past: {
    description: "Nenhum ingresso anterior foi encontrado para sua conta.",
    title: "Nenhum ingresso anterior",
  },
  upcoming: {
    description: "Nenhum ingresso futuro foi encontrado para sua conta.",
    title: "Nenhum ingresso futuro",
  },
};
