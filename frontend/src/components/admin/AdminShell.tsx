"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import {
  Building2,
  CalendarDays,
  Film,
  Grid3x3,
  LayoutDashboard,
  Tag,
  Users,
} from "lucide-react";

import { cn } from "@/components/ui/classNames";
import {
  ADMIN_NAV_LINKS,
  isAdminNavItemActive,
} from "./admin-nav-utils";

export { isAdminNavItemActive } from "./admin-nav-utils";

const navIcons: Record<string, ReactNode> = {
  "/admin": <LayoutDashboard size={16} />,
  "/admin/movies": <Film size={16} />,
  "/admin/genres": <Tag size={16} />,
  "/admin/rooms": <Building2 size={16} />,
  "/admin/seat-rows": <Grid3x3 size={16} />,
  "/admin/sessions": <CalendarDays size={16} />,
  "/admin/users": <Users size={16} />,
};

function AdminNavItem({
  active,
  href,
  label,
}: {
  active: boolean;
  href: string;
  label: string;
}) {
  return (
    <Link
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-2.5 rounded-[6px] px-3 py-2 text-sm font-bold leading-none transition duration-150 active:scale-[0.98]",
        active
          ? "bg-brand/10 text-brand"
          : "text-white/60 hover:bg-white/[0.08] hover:text-white"
      )}
      href={href}
    >
      <span aria-hidden="true" className="shrink-0">
        {navIcons[href]}
      </span>
      {label}
    </Link>
  );
}

type AdminShellProps = {
  children: ReactNode;
};

export function AdminShell({ children }: AdminShellProps) {
  const pathname = usePathname();

  const navItems = ADMIN_NAV_LINKS.map((item) => (
    <AdminNavItem
      active={isAdminNavItemActive(pathname, item.href)}
      href={item.href}
      key={item.href}
      label={item.label}
    />
  ));

  return (
    <div className="flex min-h-[calc(100vh-var(--header-height))]">
      {/* Sidebar — desktop */}
      <nav
        aria-label="Navegação administrativa"
        className={cn(
          "hidden lg:flex shrink-0 flex-col gap-1 w-56 border-r border-white/[0.07]",
          "px-3 py-4 sticky top-[var(--header-height)] self-start",
          "h-[calc(100vh-var(--header-height))]"
        )}
      >
        <p className="px-3 pb-2 text-[11px] font-[750] uppercase tracking-widest text-white/30">
          Admin
        </p>
        {navItems}
      </nav>

      {/* Top nav — mobile/tablet */}
      <div className="flex flex-col flex-1 min-w-0">
        <nav
          aria-label="Navegação administrativa"
          className={cn(
            "lg:hidden flex overflow-x-auto gap-1 border-b border-white/[0.07]",
            "px-3 py-2 [scrollbar-width:none] shrink-0"
          )}
        >
          {navItems}
        </nav>

        <main className="flex-1 p-6 min-w-0">{children}</main>
      </div>
    </div>
  );
}
