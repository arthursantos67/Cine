import { Suspense } from "react";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { MyTicketsClient } from "@/components/tickets/MyTicketsClient";
import { PageSection } from "@/components/ui/PageSection";
import { StateMessage } from "@/components/ui/StateMessage";
import { getServerLocale, getTranslator } from "@/i18n/server";

export default async function MyTicketsPage() {
  const t = getTranslator(await getServerLocale());

  return (
    <ProtectedRoute>
      <PageSection
        description={t("tickets.description")}
        eyebrow={t("tickets.eyebrow")}
        title={t("tickets.title")}
      >
        <Suspense
          fallback={
            <StateMessage tone="loading" title={t("tickets.loadingTitle")}>
              {t("tickets.loadingDescription")}
            </StateMessage>
          }
        >
          <MyTicketsClient />
        </Suspense>
      </PageSection>
    </ProtectedRoute>
  );
}
