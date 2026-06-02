import { AdminEditSessionLoader } from "@/components/admin/AdminEditSessionLoader";

export default async function AdminEditSessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <AdminEditSessionLoader sessionId={id} />;
}
