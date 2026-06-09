import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { CheckoutConfirmation } from "@/components/reservations/CheckoutConfirmation";
import { PurchaseFlowLayout } from "@/components/reservations/PurchaseFlowLayout";
import { PageSection } from "@/components/ui/PageSection";
import { getServerLocale, getTranslator } from "@/i18n/server";

export default async function ConfirmationPage() {
  const t = getTranslator(await getServerLocale());

  return (
    <ProtectedRoute>
      <PageSection
        description={t("confirmation.description")}
        eyebrow={t("confirmation.eyebrow")}
        title={t("checkout.confirmation")}
      >
        <PurchaseFlowLayout currentStep="confirmation" showSummary={false}>
          <CheckoutConfirmation />
        </PurchaseFlowLayout>
      </PageSection>
    </ProtectedRoute>
  );
}
