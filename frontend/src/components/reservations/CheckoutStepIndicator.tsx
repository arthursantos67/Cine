import { cn } from "@/components/ui/classNames";

import { getCheckoutStepStates, type CheckoutStepKey } from "./checkout-steps";

type CheckoutStepIndicatorProps = {
  currentStep: CheckoutStepKey;
};

const stepStatusLabels = {
  completed: "concluída",
  current: "atual",
  upcoming: "pendente",
} as const;

const stepStatusClasses = {
  completed: "border-success/40 bg-success/20 text-[#8ed7af]",
  current: "border-brand/70 bg-brand/20 text-white",
  upcoming: "border-white/10 bg-white/[0.04] text-text/60",
} as const;

export function CheckoutStepIndicator({
  currentStep,
}: CheckoutStepIndicatorProps) {
  const steps = getCheckoutStepStates(currentStep);

  return (
    <nav
      aria-label="Etapas da compra"
      className="checkout-steps overflow-x-auto rounded-card border border-white/10 bg-[linear-gradient(180deg,rgb(255_255_255_/_5%),rgb(255_255_255_/_2%))] p-3 text-text shadow-[0_18px_54px_rgb(0_0_0_/_18%)]"
    >
      <ol className="checkout-steps__list grid min-w-[620px] list-none grid-cols-[repeat(5,minmax(112px,1fr))] gap-2 p-0 max-lg:min-w-[560px] max-lg:grid-cols-[repeat(5,minmax(104px,1fr))] max-[420px]:min-w-[716px] max-[420px]:grid-cols-[repeat(5,minmax(136px,1fr))]">
        {steps.map((step) => (
          <li
            aria-current={step.status === "current" ? "step" : undefined}
            aria-label={`${step.label}, etapa ${step.position} de ${steps.length}, ${stepStatusLabels[step.status]}`}
            className={cn(
              "checkout-steps__item flex min-h-11 min-w-0 items-center gap-2 rounded-md border px-2.5 py-2 max-[420px]:gap-1.5 max-[420px]:p-2",
              `checkout-steps__item--${step.status}`,
              stepStatusClasses[step.status]
            )}
            key={step.key}
          >
            <span
              aria-hidden="true"
              className="checkout-steps__marker inline-flex size-[26px] shrink-0 items-center justify-center rounded-pill border-2 border-current text-[13px] font-black leading-none max-[420px]:size-6 max-[420px]:text-xs"
            >
              {step.status === "completed" ? "✓" : step.position}
            </span>
            <span className="checkout-steps__label whitespace-nowrap text-sm font-extrabold">
              {step.label}
            </span>
          </li>
        ))}
      </ol>
    </nav>
  );
}
