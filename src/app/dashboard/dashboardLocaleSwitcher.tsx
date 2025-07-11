"use client";

import { useRouter } from "next/navigation";
import { type Locale, useLocale } from "next-intl";
import updateLocale from "./updateLocale";
import { locales } from "~/config";

export default function DashboardLocaleSwitcher() {
  const router = useRouter();

  const curLocale = useLocale();

  async function action(data: FormData) {
    await updateLocale(data);

    router.refresh();
  }

  return ( 
    <form action={action} className="flex gap-3">
      {locales.map((l) => (
        l != curLocale && <LocaleButton key={l} locale={l} />
      ))}
    </form>
  );
}

function LocaleButton({ locale }: { locale: Locale }) {
  const curLocale = useLocale();

  return (
    <button
      className="py-0.5 px-1.5 border-2 rounded-sm hover:bg-white hover:text-blue-400"
      name="locale"
      type="submit"
      value={locale}
    >
      { locale.toUpperCase() }
    </button>
  );
}