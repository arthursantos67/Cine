import { SeatMap } from "@/components/seats/SeatMap";
import { PurchaseFlowLayout } from "@/components/reservations/PurchaseFlowLayout";
import { PageSection } from "@/components/ui/PageSection";

type SeatSelectionPageProps = {
  params: Promise<{
    sessionId: string;
  }>;
};

export default async function SeatSelectionPage({
  params,
}: SeatSelectionPageProps) {
  const { sessionId } = await params;

  return (
    <PageSection
      eyebrow="Sessão"
      title="Mapa de assentos"
    >
      <PurchaseFlowLayout
        currentStep="seats"
        summaryActionHref="/ticket-types"
        summaryActionLabel="Continuar"
      >
        <SeatMap sessionId={sessionId} />
      </PurchaseFlowLayout>
    </PageSection>
  );
}
