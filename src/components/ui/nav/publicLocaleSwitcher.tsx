"use client";

import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { Globe } from "lucide-react";
import { locales } from "~/config";
import updateLocale from "~/app/actions/updateLocale";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";

const localeLabels: Record<(typeof locales)[number], string> = {
  en: "English",
  ja: "日本語",
};

export function PublicLocaleSwitcher() {
  const router = useRouter();
  const curLocale = useLocale();

  async function action(data: FormData) {
    await updateLocale(data);
    router.refresh();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 text-slate-600 hover:bg-blue-50 hover:text-blue-700"
          aria-label="Change language"
          title="Change language"
        >
          <Globe className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {locales.map((l) => (
          <DropdownMenuItem key={l} asChild>
            <form action={action}>
              <button
                type="submit"
                name="locale"
                value={l}
                className={cn(
                  "w-full rounded-sm px-2 py-1.5 text-left text-sm text-slate-700 transition-colors hover:bg-blue-50 hover:text-blue-800",
                  l === curLocale &&
                    "bg-blue-50 font-semibold text-blue-900 hover:bg-blue-50 hover:text-blue-900",
                )}
              >
                {localeLabels[l]}
              </button>
            </form>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
