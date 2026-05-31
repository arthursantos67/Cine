import { AdminEmptyState, AdminToolbar } from "@/components/admin";

export default function AdminUsersPage() {
  return (
    <div className="grid gap-6">
      <AdminToolbar title="Administradores" />
      <AdminEmptyState
        description="O gerenciamento de administradores será implementado em breve."
        title="Nenhum administrador além de você"
      />
    </div>
  );
}
