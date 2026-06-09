import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { PurchaseFlowLayout } from "@/components/reservations/PurchaseFlowLayout";
import { PurchaseFlowGuard } from "@/components/reservations/PurchaseFlowGuard";
import { TicketTypeSelection } from "@/components/reservations/TicketTypeSelection";
import { PageSection } from "@/components/ui/PageSection";
import { getServerLocale, getTranslator } from "@/i18n/server";

export default async function TicketTypeSelectionPage() {
  const t = getTranslator(await getServerLocale());

  return (
    <ProtectedRoute>
      <PurchaseFlowGuard>
        <PageSection
          description={t("ticketTypes.description")}
          eyebrow={t("ticketTypes.eyebrow")}
          title={t("ticketTypes.title")}
        >
          <PurchaseFlowLayout
            currentStep="ticket-types"
            summaryActionHref="/checkout"
            summaryActionLabel={t("checkout.goToPayment")}
          >
            <TicketTypeSelection />
          </PurchaseFlowLayout>
        </PageSection>
      </PurchaseFlowGuard>
    </ProtectedRoute>
  );
}
