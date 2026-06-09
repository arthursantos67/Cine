import { cookies } from "next/headers";

import { DEFAULT_LOCALE, LOCALE_COOKIE_NAME, type Locale, resolveLocale } from "./locales";
import { messages } from "./messages";

export async function getServerLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  return resolveLocale(cookieStore.get(LOCALE_COOKIE_NAME)?.value);
}

export function getTranslator(locale: Locale) {
  return (key: string, params: Record<string, string | number> = {}) => {
    const template = messages[locale][key] ?? messages[DEFAULT_LOCALE][key] ?? key;
    return template.replace(/\{(\w+)\}/g, (_, name: string) =>
      String(params[name] ?? `{${name}}`)
    );
  };
}
