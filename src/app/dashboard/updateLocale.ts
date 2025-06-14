"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

const COOKIE_NAME = 'NEXT_LOCALE';

export default async function updateLocale(data: FormData) {
  const locale = data.get('locale') as string;

  (await cookies()).set(COOKIE_NAME, locale);

  revalidatePath('/dashboard');
}