import { MasterRoute } from "@/components/auth/MasterRoute";
import { AdminUserList } from "@/components/admin/AdminUserList";

export default function AdminUsersPage() {
  return (
    <MasterRoute>
      <AdminUserList />
    </MasterRoute>
  );
}
