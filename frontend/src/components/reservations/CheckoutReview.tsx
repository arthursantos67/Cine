"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { checkoutApi } from "@/api/checkout";
import { catalogApi } from "@/api/catalog";
import { SessionBadgeList } from "@/components/movies/SessionBadges";
import {
  getRoomDisplayName,
  getSessionBadges,
} from "@/components/movies/session-selection";
import { StateMessage } from "@/components/ui/StateMessage";
import { cn } from "@/components/ui/classNames";
import { useReservation } from "@/contexts/ReservationContext";
import type { CatalogSession } from "@/types/catalog";
import type { PaymentMethod } from "@/types/reservation";
import { formatCurrency, formatDateTime } from "@/utils/formatters";
import { useI18n } from "@/i18n";

import {
  buildCheckoutPayload,
  getCheckoutErrorMessage,
  getCheckoutSubmitBlocker,
} from "./checkout-flow";
import {
  buildOrderSummaryItems,
  calculateOrderTotal,
  getPaymentMethodLabel,
} from "./order-summary";

type SessionDetailState =
  | { status: "idle" }
  | { status: "loading" }
  | { errorMessage: string; status: "error" }
  | { session: CatalogSession; status: "success" };

export const PAYMENT_METHODS: PaymentMethod[] = ["cartao_credito", "pix"];

const checkoutPanelClasses =
  "rounded-card border border-white/10 bg-[linear-gradient(180deg,rgb(255_255_255_/_5%),rgb(255_255_255_/_2%))] p-5 text-text shadow-[0_18px_54px_rgb(0_0_0_/_18%)]";

export type PaymentMethodSelectorProps = {
  disabled?: boolean;
  onChange: (method: PaymentMethod) => void;
  selectedMethod: PaymentMethod | null;
};

export function PaymentMethodSelector({
  disabled = false,
  onChange,
  selectedMethod,
}: PaymentMethodSelectorProps) {
  const { locale, t } = useI18n();

  return (
    <fieldset className="payment-methods m-0 grid min-w-0 gap-2.5 border-0 p-0">
      <legend className="sr-only">{t("checkout.selectPayment")}</legend>
      {PAYMENT_METHODS.map((method) => (
        <label
          className="payment-methods__option grid min-h-[72px] cursor-pointer grid-cols-[auto_minmax(0,1fr)] items-center gap-3 rounded-md border border-white/10 bg-white/[0.04] p-3 text-text/80 has-[input:checked]:border-brand/70 has-[input:checked]:bg-brand/20 has-[input:checked]:text-white has-[input:checked]:shadow-[inset_0_1px_0_rgb(255_255_255_/_8%)] focus-within:border-info focus-within:shadow-[0_0_0_3px_rgb(31_111_235_/_18%)]"
          key={method}
        >
          <input
            className="size-[18px] accent-brand"
            checked={selectedMethod === method}
            disabled={disabled}
            name="payment_method"
            onChange={() => onChange(method)}
            type="radio"
            value={method}
          />
          <span className="grid min-w-0 gap-1">
            <strong className="text-base text-white">
              {getPaymentMethodLabel(method, locale)}
            </strong>
            <small className="text-sm font-bold leading-snug text-text/60">
              {method === "cartao_credito"
                ? t("checkout.creditCardDescription")
                : t("checkout.pixDescription")}
            </small>
          </span>
        </label>
      ))}
    </fieldset>
  );
}

export function CheckoutReview() {
  const { locale, t } = useI18n();
  const router = useRouter();
  const reservation = useReservation();
  const [sessionState, setSessionState] = useState<SessionDetailState>({
    status: reservation.sessionId ? "loading" : "idle",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const items = useMemo(
    () =>
      buildOrderSummaryItems(
        reservation.reservedSeats,
        reservation.ticketTypes,
        locale
      ),
    [locale, reservation.reservedSeats, reservation.ticketTypes]
  );
  const total = calculateOrderTotal(items);
  const session =
    sessionState.status === "success" ? sessionState.session : null;
  const sessionBadges = session ? getSessionBadges(session, locale) : [];

  useEffect(() => {
    let isActive = true;

    async function loadSession(sessionId: string) {
      setSessionState({ status: "loading" });

      try {
        const loadedSession = await catalogApi.getSession(sessionId);

        if (isActive) {
          setSessionState({ session: loadedSession, status: "success" });
        }
      } catch {
        if (isActive) {
          setSessionState({
            errorMessage: t("checkout.sessionLoadError"),
            status: "error",
          });
        }
      }
    }

    if (reservation.sessionId) {
      void loadSession(reservation.sessionId);
    } else {
      setSessionState({ status: "idle" });
    }

    return () => {
      isActive = false;
    };
  }, [locale, reservation.sessionId, t]);

  async function submitCheckout(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    const blocker = getCheckoutSubmitBlocker({
      paymentMethod: reservation.paymentMethod,
      reservedSeats: reservation.reservedSeats,
      locale,
    });

    if (blocker) {
      setErrorMessage(blocker);
      return;
    }

    const paymentMethod = reservation.paymentMethod;

    if (!paymentMethod) {
      setErrorMessage(t("checkout.paymentRequired"));
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const payload = buildCheckoutPayload({
        paymentMethod,
        reservedSeats: reservation.reservedSeats,
        ticketTypes: reservation.ticketTypes,
      });
      const checkoutResult = await checkoutApi.checkout(payload);

      reservation.storeCheckoutResult(checkoutResult);
      router.push("/confirmation");
    } catch (error) {
      setErrorMessage(getCheckoutErrorMessage(error, locale));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      aria-describedby={errorMessage ? "checkout-review-error" : undefined}
      className={cn("checkout-review grid gap-[18px]", checkoutPanelClasses)}
      onSubmit={submitCheckout}
    >
      <section
        aria-labelledby="revisao-pedido"
        className="checkout-review__panel grid gap-4"
      >
        <div className="checkout-review__heading grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3.5 max-lg:grid-cols-1">
          <div>
            <h2
              className="m-0 text-[21px] leading-tight text-white"
              id="revisao-pedido"
            >
              {t("checkout.reviewTitle")}
            </h2>
            <p className="m-0 mt-1.5 leading-6 text-text/65">
              {t("checkout.reviewHelp")}
            </p>
          </div>
          <strong className="inline-flex min-h-[38px] items-center whitespace-nowrap rounded-md border border-brand/50 bg-brand/20 px-3 py-1.5 text-xl text-white">
            {formatCurrency(total, locale)}
          </strong>
        </div>

        <CheckoutSessionDetails
          badges={sessionBadges}
          session={session}
        />

        {sessionState.status === "loading" ? (
          <p
            className="inline-status inline-status-info m-0 inline-flex w-fit rounded-pill border border-info/40 bg-info/15 px-2.5 py-2 text-[13px] font-extrabold leading-none text-[#b8d4ff]"
            role="status"
          >
            {t("checkout.sessionLoading")}
          </p>
        ) : null}

        {sessionState.status === "error" ? (
          <p
            className="inline-status inline-status-error m-0 inline-flex w-fit rounded-pill border border-error/45 bg-error/20 px-2.5 py-2 text-[13px] font-extrabold leading-none text-[#ffb9b2]"
            role="alert"
          >
            {sessionState.errorMessage}
          </p>
        ) : null}

        <div className="checkout-review__items grid gap-2.5" role="list">
          {items.map((item) => (
            <div
              className="checkout-review__item grid min-h-[66px] grid-cols-[minmax(88px,0.8fr)_minmax(120px,1fr)_auto] gap-3 rounded-md border border-white/10 border-l-[3px] border-l-brand/60 bg-[linear-gradient(90deg,rgb(179_19_34_/_8%),transparent_44%),rgb(255_255_255_/_4%)] p-3 max-lg:grid-cols-1"
              key={item.seat.sessionSeatId}
              role="listitem"
            >
              <div className="grid min-w-0 gap-0.5">
                <span className="text-[13px] font-extrabold text-text/65">
                  {t("tickets.seat")}
                </span>
                <strong className="text-[15px] text-white">
                  {item.seatLabel}
                </strong>
              </div>
              <div className="grid min-w-0 gap-0.5">
                <span className="text-[13px] font-extrabold text-text/65">
                  {t("tickets.ticket")}
                </span>
                <strong className="text-[15px] text-white">
                  {item.ticketTypeLabel}
                </strong>
              </div>
              <div className="grid min-w-0 gap-0.5">
                <span className="text-[13px] font-extrabold text-text/65">
                  {t("checkout.unitPrice")}
                </span>
                <strong className="text-[15px] text-white">
                  {formatCurrency(item.unitPrice, locale)}
                </strong>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section
        aria-labelledby="forma-pagamento"
        className="checkout-review__panel grid gap-4 border-t border-white/10 pt-[18px]"
      >
        <div className="checkout-review__heading grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3.5 max-lg:grid-cols-1">
          <div>
            <h2
              className="m-0 text-[21px] leading-tight text-white"
              id="forma-pagamento"
            >
              {t("checkout.selectPayment")}
            </h2>
            <p className="m-0 mt-1.5 leading-6 text-text/65">
              {t("checkout.paymentHelp")}
            </p>
          </div>
        </div>

        <PaymentMethodSelector
          disabled={isSubmitting}
          onChange={(method) => {
            reservation.setPaymentMethod(method);
            setErrorMessage(null);
          }}
          selectedMethod={reservation.paymentMethod}
        />
      </section>

      {errorMessage ? (
        <div id="checkout-review-error">
          <StateMessage tone="error" title={t("checkout.errorTitle")}>
            {errorMessage}
          </StateMessage>
        </div>
      ) : null}

      <button
        className="checkout-review__submit inline-flex min-h-10 min-w-[190px] items-center justify-center justify-self-end rounded-md border border-brand bg-brand px-3.5 text-sm font-extrabold leading-none text-white transition hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-70 max-lg:w-full max-lg:justify-self-stretch"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? t("checkout.submitLoading") : t("checkout.confirm")}
      </button>
    </form>
  );
}

export function CheckoutSessionDetails({
  badges,
  session,
}: {
  badges: ReturnType<typeof getSessionBadges>;
  session: CatalogSession | null;
}) {
  const { locale, t } = useI18n();

  return (
    <dl className="checkout-review__session m-0 grid gap-2.5">
      <div className="flex min-w-0 items-center justify-between gap-3.5 rounded-md border border-white/10 bg-white/[0.04] px-3 py-2.5 max-[420px]:grid max-[420px]:items-start max-[420px]:gap-1">
        <dt className="text-sm font-extrabold text-text/65">{t("tickets.movie")}</dt>
        <dd className="m-0 text-right font-extrabold max-[420px]:text-left">
          {session?.movie.title ?? t("movie.unavailable")}
        </dd>
      </div>
      <div className="flex min-w-0 items-center justify-between gap-3.5 rounded-md border border-white/10 bg-white/[0.04] px-3 py-2.5 max-[420px]:grid max-[420px]:items-start max-[420px]:gap-1">
        <dt className="text-sm font-extrabold text-text/65">{t("tickets.session")}</dt>
        <dd className="m-0 text-right font-extrabold max-[420px]:text-left">
          {session
            ? formatDateTime(session.start_time, locale)
            : t("session.dateTimeUnavailable")}
        </dd>
      </div>
      <div className="flex min-w-0 items-center justify-between gap-3.5 rounded-md border border-white/10 bg-white/[0.04] px-3 py-2.5 max-[420px]:grid max-[420px]:items-start max-[420px]:gap-1">
        <dt className="text-sm font-extrabold text-text/65">{t("tickets.room")}</dt>
        <dd className="m-0 text-right font-extrabold max-[420px]:text-left">
          {session ? getRoomDisplayName(session.room) : t("session.roomUnavailable")}
        </dd>
      </div>
      {session ? (
        <div className="flex min-w-0 items-center justify-between gap-3.5 rounded-md border border-white/10 bg-white/[0.04] px-3 py-2.5 max-[420px]:grid max-[420px]:items-start max-[420px]:gap-1">
          <dt className="text-sm font-extrabold text-text/65">{t("session.format")}</dt>
          <dd className="m-0 text-right font-extrabold max-[420px]:text-left">
            {badges.length > 0 ? (
              <SessionBadgeList
                badges={badges}
                className="checkout-review__badges"
              />
            ) : (
              t("session.formatDefault")
            )}
          </dd>
        </div>
      ) : null}
    </dl>
  );
}
