import { AdminRoomForm } from "@/components/admin";
import { AdminToolbar } from "@/components/admin";
import { getServerLocale, getTranslator } from "@/i18n/server";

export default async function AdminNewRoomPage() {
  const t = getTranslator(await getServerLocale());

  return (
    <div className="grid gap-6">
      <AdminToolbar title={t("admin.room.new")} />
      <AdminRoomForm />
    </div>
  );
}
