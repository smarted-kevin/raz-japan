import Link from "next/link";
import { BookOpen } from "lucide-react";
import { publicSiteContainerClassName } from "~/lib/public-layout";
import { cn } from "~/lib/utils";
import { PublicNavLinks } from "./publicNavLinks";
import { MobileNavMenu } from "./mobileNavMenu";
import { isMemberSignupEnabled } from "~/lib/member-signup";

type PublicNavBarProps = {
  branded?: boolean;
};

export function PublicNavBar({ branded = false }: PublicNavBarProps) {
  const memberSignupEnabled = isMemberSignupEnabled();

  return (
    <nav className="border-border bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 w-full border-b backdrop-blur">
      <div
        className={cn(
          publicSiteContainerClassName,
          "flex h-16 items-center justify-between gap-2",
        )}
      >
        <Link
          href="/"
          className="group flex shrink-0 items-center gap-2.5 transition-opacity hover:opacity-90"
        >
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br shadow-md ring-1 transition-shadow group-hover:shadow-lg",
              branded
                ? "from-[#c83192] to-[#8f1f69] shadow-[#c83192]/25 ring-[#c83192]/20 group-hover:shadow-[#c83192]/30"
                : "from-blue-600 to-indigo-700 shadow-blue-600/25 ring-blue-500/20 group-hover:shadow-blue-600/30",
            )}
          >
            <BookOpen
              className="h-6 w-6 text-white"
              aria-hidden
              strokeWidth={2}
            />
          </div>
          <span
            className={cn(
              "bg-gradient-to-r bg-clip-text text-xl font-bold tracking-tight whitespace-nowrap text-transparent",
              branded
                ? "from-[#651348] via-[#92206c] to-[#c83192]"
                : "from-blue-950 via-blue-900 to-indigo-700",
            )}
          >
            Raz-Japan
          </span>
        </Link>
        <div className="flex min-w-0 items-center gap-2">
          <PublicNavLinks
            memberSignupEnabled={memberSignupEnabled}
            branded={branded}
          />
          <MobileNavMenu
            memberSignupEnabled={memberSignupEnabled}
            branded={branded}
          />
        </div>
      </div>
    </nav>
  );
}
