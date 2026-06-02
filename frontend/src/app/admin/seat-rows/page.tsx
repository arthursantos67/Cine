import { AdminEmptyState, AdminToolbar } from "@/components/admin";
import { ButtonLink } from "@/components/ui/Button";

export default function AdminSeatRowsPage() {
  return (
    <div className="grid gap-6">
      <AdminToolbar
        actions={
          <ButtonLink href="#" size="sm" variant="primary">
            Nova fileira
          </ButtonLink>
        }
        title="Fileiras e Assentos"
      />
      <AdminEmptyState
        description="O gerenciamento de fileiras e assentos será implementado em breve."
        title="Nenhuma fileira cadastrada"
      />
    </div>
  );
}
