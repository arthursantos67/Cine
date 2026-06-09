import { DEFAULT_LOCALE, type Locale, resolveLocale } from "@/i18n/locales";

export const ptBrLocale = DEFAULT_LOCALE;

export function formatCurrency(value: number, locale: Locale | string = DEFAULT_LOCALE) {
  return new Intl.NumberFormat(resolveLocale(locale), {
    currency: "BRL",
    style: "currency",
  }).format(value);
}

export function formatDateTime(
  value: string | number | Date,
  locale: Locale | string = DEFAULT_LOCALE
) {
  return new Intl.DateTimeFormat(resolveLocale(locale), {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Fortaleza",
  }).format(new Date(value));
}
