import { getRequestConfig } from "next-intl/server";
import { hasLocale } from "next-intl";
import { defaultLocale, locales } from "../config";
import { getUserLocale } from "~/db";

interface ImportedMeassages {
  default: Record<string, string>;
}

export default getRequestConfig(async ({ requestLocale } ) => {
  // Read from potential `[locale]` segment
  let candidate = await requestLocale;

  // The user is logged in
  candidate ??= await getUserLocale();

  const locale = hasLocale(locales, candidate)
    ? candidate
    : defaultLocale;

  const messages = await import(`../../messages/${locale}.json`) as ImportedMeassages;

  return {
    locale,
    messages: messages.default
  };
});