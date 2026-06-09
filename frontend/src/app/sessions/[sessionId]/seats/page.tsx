import { SeatMap } from "@/components/seats/SeatMap";
import { PurchaseFlowLayout } from "@/components/reservations/PurchaseFlowLayout";
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
        summaryActionHref="/ticket-types"
        summaryActionLabel={t("common.continue")}
      >
        <SeatMap sessionId={sessionId} />
      </PurchaseFlowLayout>
    </PageSection>
  );
}
