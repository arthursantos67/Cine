import { AdminEmptyState, AdminToolbar } from "@/components/admin";
import { ButtonLink } from "@/components/ui/Button";

export default function AdminGenresPage() {
  return (
    <div className="grid gap-6">
      <AdminToolbar
        actions={
          <ButtonLink href="#" size="sm" variant="primary">
            Novo gênero
          </ButtonLink>
        }
        title="Gêneros"
      />
      <AdminEmptyState
        description="O gerenciamento de gêneros será implementado em breve."
        title="Nenhum gênero cadastrado"
      />
    </div>
  );
}
