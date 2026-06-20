import { cookies } from "next/headers";
import { type Locale } from "next-intl";
import { defaultLocale } from "./config";
import { isAppLocale, LOCALE_COOKIE_NAME } from "~/lib/locale";


export async function getUserLocale(): Promise<Locale> {
  const candidate = (await cookies()).get(LOCALE_COOKIE_NAME)?.value;
  return isAppLocale(candidate) ? candidate : defaultLocale;
}

export async function setUserLocale(locale: string) {
  (await cookies()).set(LOCALE_COOKIE_NAME, locale);
}