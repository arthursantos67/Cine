import { HomeCatalog } from "./HomeCatalog";
import { getServerLocale, getTranslator } from "@/i18n/server";

export default async function HomePage() {
  const t = getTranslator(await getServerLocale());

  return (
    <>
      <h1 className="sr-only">{t("home.h1")}</h1>
      <HomeCatalog />
    </>
  );
}
