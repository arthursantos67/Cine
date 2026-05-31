"use client";

import { AdminRoute } from "@/components/auth/AdminRoute";
import { AdminShell } from "@/components/admin/AdminShell";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminRoute>
      <AdminShell>{children}</AdminShell>
    </AdminRoute>
  );
}
