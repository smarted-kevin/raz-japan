"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { locales } from "~/config";
import { hasLocale } from "next-intl";
import { LOCALE_COOKIE_NAME } from "~/lib/locale";

export default async function updateLocale(data: FormData) {
  const locale = data.get("locale") as string;

  if (!hasLocale(locales, locale)) {
    return;
  }

  (await cookies()).set(LOCALE_COOKIE_NAME, locale);

  revalidatePath("/");
  revalidatePath("/dashboard");
}
