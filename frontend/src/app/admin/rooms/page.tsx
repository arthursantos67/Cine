import { AdminEmptyState, AdminToolbar } from "@/components/admin";
import { ButtonLink } from "@/components/ui/Button";

export default function AdminRoomsPage() {
  return (
    <div className="grid gap-6">
      <AdminToolbar
        actions={
          <ButtonLink href="#" size="sm" variant="primary">
            Nova sala
          </ButtonLink>
        }
        title="Salas"
      />
      <AdminEmptyState
        description="O gerenciamento de salas será implementado em breve."
        title="Nenhuma sala cadastrada"
      />
    </div>
  );
}
