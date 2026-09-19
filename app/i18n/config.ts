export const locales = ["pt", "es", "en"] as const;

export type Locale = (typeof locales)[number];

export const localeDetails: Record<Locale, { htmlLang: string; label: string; shortLabel: string; href: string }> = {
  pt: { htmlLang: "pt-BR", label: "Português", shortLabel: "PT", href: "/" },
  es: { htmlLang: "es", label: "Español", shortLabel: "ES", href: "/es" },
  en: { htmlLang: "en", label: "English", shortLabel: "EN", href: "/en" },
};

export function localeFromPathname(pathname: string | null | undefined): Locale {
  if (pathname === "/es" || pathname?.startsWith("/es/")) return "es";
  if (pathname === "/en" || pathname?.startsWith("/en/")) return "en";
  return "pt";
}

export function stripLocalePrefix(pathname: string): string {
  const stripped = pathname.replace(/^\/(?:es|en)(?=\/|$)/, "");
  return stripped || "/";
}

/**
 * Only the home page is localized in the first milestone. Internal links keep
 * pointing at the existing Portuguese pages until their translated route is ready.
 */
export function localizedPublicPath(locale: Locale, path: string): string {
  if (path === "/") return localeDetails[locale].href;
  return path;
}

