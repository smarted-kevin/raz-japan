import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  // List of all supported locales
  locales: ['en', 'ja'],

  // Used when no locale matches
  defaultLocale: 'en'
});