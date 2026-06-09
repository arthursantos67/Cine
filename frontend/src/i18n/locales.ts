export const DEFAULT_LOCALE = "pt-BR";
export const FALLBACK_LOCALE = DEFAULT_LOCALE;
export const LOCALE_COOKIE_NAME = "cineprime_locale";
export const SUPPORTED_LOCALES = [
  "pt-BR",
  "en-US",
  "es-ES",
  "fr-FR",
  "de-DE",
  "it-IT",
  "zh-CN",
  "ja-JP",
] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number];

const localeAliases: Record<string, Locale> = {
  en: "en-US",
  "en-us": "en-US",
  en_us: "en-US",
  pt: "pt-BR",
  "pt-br": "pt-BR",
  pt_br: "pt-BR",
  es: "es-ES",
  "es-es": "es-ES",
  es_es: "es-ES",
  fr: "fr-FR",
  "fr-fr": "fr-FR",
  fr_fr: "fr-FR",
  de: "de-DE",
  "de-de": "de-DE",
  de_de: "de-DE",
  it: "it-IT",
  "it-it": "it-IT",
  it_it: "it-IT",
  zh: "zh-CN",
  "zh-cn": "zh-CN",
  zh_cn: "zh-CN",
  ja: "ja-JP",
  "ja-jp": "ja-JP",
  ja_jp: "ja-JP",
};

export function normalizeLocale(value: unknown): Locale | null {
  if (typeof value !== "string") {
    return null;
  }

  const key = value.trim().replaceAll("_", "-").toLowerCase();
  return localeAliases[key] ?? null;
}

export function resolveLocale(value: unknown): Locale {
  return normalizeLocale(value) ?? DEFAULT_LOCALE;
}

export function isSupportedLocale(value: unknown): value is Locale {
  return normalizeLocale(value) !== null;
}
