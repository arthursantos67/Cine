import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { CheckoutReview } from "@/components/reservations/CheckoutReview";
import { PurchaseFlowLayout } from "@/components/reservations/PurchaseFlowLayout";
import { PurchaseFlowGuard } from "@/components/reservations/PurchaseFlowGuard";
import { PageSection } from "@/components/ui/PageSection";
import { getServerLocale, getTranslator } from "@/i18n/server";

export default async function CheckoutPage() {
  const t = getTranslator(await getServerLocale());

  return (
    <ProtectedRoute>
      <PurchaseFlowGuard>
        <PageSection
          description={t("checkout.reviewDescription")}
          eyebrow={t("checkout.payment")}
          title={t("checkout.finish")}
        >
          <PurchaseFlowLayout currentStep="checkout">
            <CheckoutReview />
          </PurchaseFlowLayout>
        </PageSection>
      </PurchaseFlowGuard>
    </ProtectedRoute>
  );
}
