import { AdminEmptyState, AdminToolbar } from "@/components/admin";
import { ButtonLink } from "@/components/ui/Button";

export default function AdminMoviesPage() {
  return (
    <div className="grid gap-6">
      <AdminToolbar
        actions={
          <ButtonLink href="#" size="sm" variant="primary">
            Novo filme
          </ButtonLink>
        }
        title="Filmes"
      />
      <AdminEmptyState
        description="O gerenciamento de filmes será implementado em breve."
        title="Nenhum filme cadastrado"
      />
    </div>
  );
}
