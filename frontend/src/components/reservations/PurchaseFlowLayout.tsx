import type { ReactNode } from "react";

import { cn } from "@/components/ui/classNames";

import { CheckoutStepIndicator } from "./CheckoutStepIndicator";
import { ReservationOrderSummary } from "./OrderSummaryPanel";
import type { CheckoutStepKey } from "./checkout-steps";

type PurchaseFlowLayoutProps = {
  children: ReactNode;
  currentStep: CheckoutStepKey;
  showSummary?: boolean;
  summaryActionHref?: string;
  summaryActionLabel?: string;
};

export function PurchaseFlowLayout({
  children,
  currentStep,
  showSummary = true,
  summaryActionHref,
  summaryActionLabel,
}: PurchaseFlowLayoutProps) {
  return (
    <div
      className={cn(
        "purchase-flow",
        `purchase-flow--${currentStep}`,
        "grid gap-[18px]",
        showSummary ? undefined : "purchase-flow--no-summary"
      )}
    >
      <CheckoutStepIndicator currentStep={currentStep} />
      <div
        className={cn(
          "purchase-flow__body grid items-start gap-5",
          showSummary && currentStep !== "seats"
            ? "grid-cols-[minmax(0,1fr)_minmax(288px,340px)] max-lg:grid-cols-1"
            : "grid-cols-1"
        )}
      >
        <div className="purchase-flow__primary grid min-w-0 gap-[18px]">
          {children}
        </div>
        {showSummary ? (
          <div className="purchase-flow__summary sticky top-24 min-w-0 max-lg:static">
            <ReservationOrderSummary
              actionHref={summaryActionHref}
              actionLabel={summaryActionLabel}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
