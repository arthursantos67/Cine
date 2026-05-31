import { AdminEmptyState, AdminToolbar } from "@/components/admin";
import { ButtonLink } from "@/components/ui/Button";

export default function AdminSessionsPage() {
  return (
    <div className="grid gap-6">
      <AdminToolbar
        actions={
          <ButtonLink href="#" size="sm" variant="primary">
            Nova sessão
          </ButtonLink>
        }
        title="Sessões"
      />
      <AdminEmptyState
        description="O gerenciamento de sessões será implementado em breve."
        title="Nenhuma sessão cadastrada"
      />
    </div>
  );
}
