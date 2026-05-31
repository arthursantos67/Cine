export type AdminNavLink = {
  href: string;
  label: string;
};

export const ADMIN_NAV_LINKS: AdminNavLink[] = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/movies", label: "Filmes" },
  { href: "/admin/genres", label: "Gêneros" },
  { href: "/admin/rooms", label: "Salas" },
  { href: "/admin/seat-rows", label: "Fileiras e Assentos" },
  { href: "/admin/sessions", label: "Sessões" },
  { href: "/admin/users", label: "Administradores" },
];

export function isAdminNavItemActive(pathname: string, href: string) {
  if (href === "/admin") {
    return pathname === "/admin";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}
