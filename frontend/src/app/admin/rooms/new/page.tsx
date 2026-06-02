import { AdminRoomForm } from "@/components/admin";
import { AdminToolbar } from "@/components/admin";

export default function AdminNewRoomPage() {
  return (
    <div className="grid gap-6">
      <AdminToolbar title="Nova sala" />
      <AdminRoomForm />
    </div>
  );
}
