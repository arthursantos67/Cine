import { AdminEmptyState, AdminToolbar } from "@/components/admin";
import { ButtonLink } from "@/components/ui/Button";

export default function AdminSeatRowsPage() {
  return (
    <div className="grid gap-6">
      <AdminToolbar title="Fileiras e Assentos" />
      <AdminEmptyState
        description="O gerenciamento de fileiras e assentos é feito através do editor de layout de cada sala."
        title="Acesse via Salas"
      />
      <div className="flex justify-start">
        <ButtonLink href="/admin/rooms" size="sm" variant="primary">
          Ir para Salas
        </ButtonLink>
      </div>
    </div>
  );
}
