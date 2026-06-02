import { AdminRoomLayoutEditor } from "@/components/admin";

export default async function AdminRoomLayoutPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { roomId } = await params;
  return <AdminRoomLayoutEditor roomId={roomId} />;
}
