import assert from "node:assert/strict";
import test from "node:test";

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { isAdminNavItemActive } from "./admin-nav-utils";
import { AdminEmptyState } from "./AdminEmptyState";
import { AdminToolbar } from "./AdminToolbar";

// --- isAdminNavItemActive ---

test("dashboard link is active only on the exact /admin path", () => {
  assert.equal(isAdminNavItemActive("/admin", "/admin"), true);
  assert.equal(isAdminNavItemActive("/admin/movies", "/admin"), false);
  assert.equal(isAdminNavItemActive("/admin/users", "/admin"), false);
});

test("section link is active on its own path and nested paths", () => {
  assert.equal(isAdminNavItemActive("/admin/movies", "/admin/movies"), true);
  assert.equal(
    isAdminNavItemActive("/admin/movies/edit/123", "/admin/movies"),
    true
  );
  assert.equal(isAdminNavItemActive("/admin/genres", "/admin/movies"), false);
});

test("no nav item is active on unrelated paths", () => {
  assert.equal(isAdminNavItemActive("/", "/admin"), false);
  assert.equal(isAdminNavItemActive("/checkout", "/admin/sessions"), false);
});

// --- AdminEmptyState rendering ---

test("AdminEmptyState renders title and description", () => {
  const html = renderToStaticMarkup(
    createElement(AdminEmptyState, {
      title: "Nenhum item",
      description: "Cadastre um item para começar.",
    })
  );

  assert.match(html, /Nenhum item/);
  assert.match(html, /Cadastre um item para começar\./);
});

test("AdminEmptyState renders without description", () => {
  const html = renderToStaticMarkup(
    createElement(AdminEmptyState, { title: "Lista vazia" })
  );

  assert.match(html, /Lista vazia/);
  assert.doesNotMatch(html, /<p[^>]*>\s*<\/p>/);
});

// --- AdminToolbar rendering ---

test("AdminToolbar renders title", () => {
  const html = renderToStaticMarkup(
    createElement(AdminToolbar, { title: "Filmes" })
  );

  assert.match(html, /Filmes/);
});

test("AdminToolbar renders search input when onSearch is provided", () => {
  const html = renderToStaticMarkup(
    createElement(AdminToolbar, {
      title: "Sessões",
      onSearch: () => {},
      searchPlaceholder: "Buscar sessão...",
    })
  );

  assert.match(html, /Buscar sessão\.\.\./);
  assert.match(html, /type="search"/);
});

test("AdminToolbar omits search input when onSearch is not provided", () => {
  const html = renderToStaticMarkup(
    createElement(AdminToolbar, { title: "Administradores" })
  );

  assert.doesNotMatch(html, /type="search"/);
});
