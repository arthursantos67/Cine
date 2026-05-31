import { AdminRoute } from "@/components/auth/AdminRoute";
import { PageSection } from "@/components/ui/PageSection";

export default function AdminPage() {
  return (
    <AdminRoute>
      <PageSection
        description="Gerencie usuários, sessões e configurações do sistema."
        eyebrow="Administração"
        title="Painel Admin"
      >
        <p className="text-white/60">Em construção.</p>
      </PageSection>
    </AdminRoute>
  );
}
