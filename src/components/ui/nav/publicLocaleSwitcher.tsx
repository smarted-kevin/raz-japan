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
          className="text-foreground hover:bg-muted"
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
                className={`w-full text-left px-2 py-1.5 ${
                  l === curLocale ? "font-semibold bg-muted" : ""
                }`}
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
