"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { locales } from "~/config";
import { hasLocale } from "next-intl";

const COOKIE_NAME = "NEXT_LOCALE";

export default async function updateLocale(data: FormData) {
  const locale = data.get("locale") as string;

  if (!hasLocale(locales, locale)) {
    return;
  }

  (await cookies()).set(COOKIE_NAME, locale);

  revalidatePath("/");
  revalidatePath("/dashboard");
}
