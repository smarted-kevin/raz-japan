"use client";

import { useRouter } from "next/navigation";
import { type Locale, useLocale } from "next-intl";
import { Globe } from "lucide-react";
import updateLocale from "./updateLocale";
import { locales } from "~/config";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";

interface DashboardLocaleSwitcherProps {
  collapsed?: boolean;
}

export default function DashboardLocaleSwitcher({ collapsed = false }: DashboardLocaleSwitcherProps) {
  const router = useRouter();
  const curLocale = useLocale();

  async function action(data: FormData) {
    await updateLocale(data);
    router.refresh();
  }

  if (collapsed) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20 hover:text-white flex-shrink-0"
            aria-label="Change language"
            title="Change language"
          >
            <Globe className="h-5 w-5 flex-shrink-0" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" side="right">
          {locales.map((l) => (
            <DropdownMenuItem key={l} asChild>
              <form action={action}>
                <button
                  type="submit"
                  name="locale"
                  value={l}
                  className={cn(
                    "w-full text-left",
                    l === curLocale && "font-semibold"
                  )}
                >
                  {l.toUpperCase()}
                </button>
              </form>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
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
      className="py-0.5 px-1.5 border-2 rounded-sm hover:bg-white hover:text-blue-400 transition-colors duration-500 text-white border-white/30"
      name="locale"
      type="submit"
      value={locale}
    >
      { locale.toUpperCase() }
    </button>
  );
}