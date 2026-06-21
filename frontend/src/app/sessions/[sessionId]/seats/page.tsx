import { SeatMap } from "@/components/seats/SeatMap";
import { PurchaseFlowLayout } from "@/components/reservations/PurchaseFlowLayout";
import { SessionMoviePreview } from "@/components/reservations/SessionMoviePreview";
import { PageSection } from "@/components/ui/PageSection";
import { getServerLocale, getTranslator } from "@/i18n/server";

type SeatSelectionPageProps = {
  params: Promise<{
    sessionId: string;
  }>;
};

export default async function SeatSelectionPage({
  params,
}: SeatSelectionPageProps) {
  const { sessionId } = await params;
  const t = getTranslator(await getServerLocale());

  return (
    <PageSection
      eyebrow={t("session.eyebrow")}
      title={t("seats.title")}
    >
      <PurchaseFlowLayout
        currentStep="seats"
        showSummary={false}
      >
        <div className="flex gap-6 items-start">
          <div className="min-w-0 flex-1 overflow-x-auto">
            <div className="min-w-[900px]">
              <SeatMap sessionId={sessionId} />
            </div>
          </div>
          <div className="hidden md:flex md:flex-col md:w-[300px] md:shrink-0 md:sticky md:top-24">
            <SessionMoviePreview
              sessionId={sessionId}
              showOrderSummary
              summaryActionHref="/ticket-types"
              summaryActionLabel={t("common.continue")}
            />
          </div>
        </div>
      </PurchaseFlowLayout>
    </PageSection>
  );
}
