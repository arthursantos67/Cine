import assert from "node:assert/strict";
import test from "node:test";

import { DEFAULT_LOCALE, normalizeLocale, resolveLocale } from "./locales";

test("normalizeLocale accepts supported aliases", () => {
  assert.equal(normalizeLocale("pt"), "pt-BR");
  assert.equal(normalizeLocale("pt_BR"), "pt-BR");
  assert.equal(normalizeLocale("en"), "en-US");
  assert.equal(normalizeLocale("en-US"), "en-US");
});

test("resolveLocale falls back to the documented default locale", () => {
  assert.equal(resolveLocale("ko-KR"), DEFAULT_LOCALE);
  assert.equal(resolveLocale(null), DEFAULT_LOCALE);
});
