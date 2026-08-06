import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";

const BASE_URL = "https://www.usajusho.com";

const PUBLIC_PATHS = [
  "",
  "/how-it-works",
  "/purchase-agency",
  "/customs",
  "/legal/terms",
  "/legal/privacy",
  "/login",
  "/signup",
];

function localizedUrl(locale: string, path: string) {
  return `${BASE_URL}/${locale}${path}`;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return PUBLIC_PATHS.map((path) => {
    const languages = Object.fromEntries(
      routing.locales.map((locale) => [locale, localizedUrl(locale, path)]),
    );

    return {
      url: localizedUrl(routing.defaultLocale, path),
      lastModified: now,
      changeFrequency: path === "" ? ("daily" as const) : ("monthly" as const),
      priority: path === "" ? 1 : 0.7,
      alternates: { languages },
    };
  });
}
