import { defaultLocale, locales } from "~/config";

export type AppLocale = (typeof locales)[number];

export const LOCALE_COOKIE_NAME = "NEXT_LOCALE";

export function isAppLocale(locale: string | null | undefined): locale is AppLocale {
  return locales.includes(locale as AppLocale);
}

export function detectLocaleFromAcceptLanguage(
  acceptLanguage: string | null,
): AppLocale {
  if (!acceptLanguage) {
    return defaultLocale;
  }

  const preferredLanguages = acceptLanguage
    .split(",")
    .map((language) => language.trim().split(";")[0]?.toLowerCase())
    .filter((language): language is string => Boolean(language));

  return preferredLanguages.some(
    (language) => language === "ja" || language.startsWith("ja-"),
  )
    ? "ja"
    : defaultLocale;
}
