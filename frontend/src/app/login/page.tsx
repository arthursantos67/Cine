import Link from "next/link";

import { LoginForm } from "@/components/auth/LoginForm";
import { PageSection } from "@/components/ui/PageSection";
import { StateMessage } from "@/components/ui/StateMessage";
import { getServerLocale, getTranslator } from "@/i18n/server";

export default async function LoginPage() {
  const t = getTranslator(await getServerLocale());

  return (
    <PageSection
      description={t("auth.loginDescription")}
      eyebrow={t("auth.eyebrow")}
      title={t("auth.login")}
    >
      <LoginForm />
      <StateMessage title={t("auth.noAccount")}>
        <Link className="text-link" href="/register">
          {t("auth.registerLink")}
        </Link>{" "}
        {t("auth.registerSuffix")}
      </StateMessage>
    </PageSection>
  );
}
