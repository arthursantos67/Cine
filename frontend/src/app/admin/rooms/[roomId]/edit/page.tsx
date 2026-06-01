import { AdminEditRoomLoader } from "@/components/admin/AdminEditRoomLoader";

export default async function AdminEditRoomPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { roomId } = await params;
  return <AdminEditRoomLoader roomId={roomId} />;
}
