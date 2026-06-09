import { AdminSessionForm } from "@/components/admin/AdminSessionForm";
import { AdminToolbar } from "@/components/admin";
import { ButtonLink } from "@/components/ui/Button";
import { getServerLocale, getTranslator } from "@/i18n/server";

export default async function AdminNewSessionPage() {
  const t = getTranslator(await getServerLocale());

  return (
    <div className="grid gap-6">
      <AdminToolbar
        actions={
          <ButtonLink href="/admin/sessions" size="sm" variant="ghost">
            {t("admin.back")}
          </ButtonLink>
        }
        title={t("admin.session.new")}
      />
      <AdminSessionForm />
    </div>
  );
}
