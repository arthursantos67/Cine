import { AdminMovieForm } from "@/components/admin";
import { AdminToolbar } from "@/components/admin";
import { ButtonLink } from "@/components/ui/Button";

export default function AdminNewMoviePage() {
  return (
    <div className="grid gap-6">
      <AdminToolbar
        actions={
          <ButtonLink href="/admin/movies" size="sm" variant="ghost">
            Voltar
          </ButtonLink>
        }
        title="Novo filme"
      />
      <AdminMovieForm />
    </div>
  );
}
