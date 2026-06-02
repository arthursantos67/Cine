import { AdminSessionForm } from "@/components/admin/AdminSessionForm";
import { AdminToolbar } from "@/components/admin";
import { ButtonLink } from "@/components/ui/Button";

export default function AdminNewSessionPage() {
  return (
    <div className="grid gap-6">
      <AdminToolbar
        actions={
          <ButtonLink href="/admin/sessions" size="sm" variant="ghost">
            Voltar
          </ButtonLink>
        }
        title="Nova sessão"
      />
      <AdminSessionForm />
    </div>
  );
}
