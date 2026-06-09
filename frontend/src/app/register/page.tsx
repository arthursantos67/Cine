import Link from "next/link";

import { RegisterForm } from "@/components/auth/RegisterForm";
import { PageSection } from "@/components/ui/PageSection";
import { StateMessage } from "@/components/ui/StateMessage";
import { getServerLocale, getTranslator } from "@/i18n/server";

export default async function RegisterPage() {
  const t = getTranslator(await getServerLocale());

  return (
    <PageSection
      description={t("auth.registerDescription")}
      eyebrow={t("auth.eyebrow")}
      title={t("auth.createAccount")}
    >
      <RegisterForm />
      <StateMessage title={t("auth.haveAccount")}>
        <Link className="text-link" href="/login">
          {t("auth.loginLink")}
        </Link>{" "}
        {t("auth.loginSuffix")}
      </StateMessage>
    </PageSection>
  );
}
