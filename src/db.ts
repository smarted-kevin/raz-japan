import { cookies } from "next/headers";
import { type Locale, hasLocale } from "next-intl";
import { defaultLocale, locales } from "./config";


const COOKIE_NAME = 'NEXT_LOCALE';

export async function getUserLocale(): Promise<Locale> {
  const candidate = (await cookies()).get(COOKIE_NAME)?.value;
  return hasLocale(locales, candidate) ? candidate : defaultLocale;
}

export async function setUserLocale(locale: string) {
  (await cookies()).set(COOKIE_NAME, locale);
}