import { AdminMovieForm } from "@/components/admin";
import { AdminToolbar } from "@/components/admin";
import { ButtonLink } from "@/components/ui/Button";
import { getServerLocale, getTranslator } from "@/i18n/server";

export default async function AdminNewMoviePage() {
  const t = getTranslator(await getServerLocale());

  return (
    <div className="grid gap-6">
      <AdminToolbar
        actions={
          <ButtonLink href="/admin/movies" size="sm" variant="ghost">
            {t("admin.back")}
          </ButtonLink>
        }
        title={t("admin.movie.new")}
      />
      <AdminMovieForm />
    </div>
  );
}
