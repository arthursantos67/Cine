import { AdminEmptyState, AdminToolbar } from "@/components/admin";
import { ButtonLink } from "@/components/ui/Button";
import { getServerLocale, getTranslator } from "@/i18n/server";

export default async function AdminSeatRowsPage() {
  const t = getTranslator(await getServerLocale());

  return (
    <div className="grid gap-6">
      <AdminToolbar title={t("admin.seats")} />
      <AdminEmptyState
        description={t("admin.seats.emptyDescription")}
        title={t("admin.seats.emptyTitle")}
      />
      <div className="flex justify-start">
        <ButtonLink href="/admin/rooms" size="sm" variant="primary">
          {t("admin.seats.goToRooms")}
        </ButtonLink>
      </div>
    </div>
  );
}
