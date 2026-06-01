import { AdminEditMovieLoader } from "@/components/admin/AdminEditMovieLoader";

export default async function AdminEditMoviePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <AdminEditMovieLoader movieId={id} />;
}
