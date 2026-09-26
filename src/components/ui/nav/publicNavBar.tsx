import Link from "next/link";
import { BookOpen } from "lucide-react";
import { publicSiteContainerClassName } from "~/lib/public-layout";
import { cn } from "~/lib/utils";
import { PublicNavLinks } from "./publicNavLinks";
import { MobileNavMenu } from "./mobileNavMenu";
import { isMemberSignupEnabled } from "~/lib/member-signup";

export function PublicNavBar() {
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
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 shadow-md ring-1 shadow-blue-600/25 ring-blue-500/20 transition-shadow group-hover:shadow-lg group-hover:shadow-blue-600/30">
            <BookOpen
              className="h-6 w-6 text-white"
              aria-hidden
              strokeWidth={2}
            />
          </div>
          <span className="bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-700 bg-clip-text text-xl font-bold tracking-tight whitespace-nowrap text-transparent">
            Raz-Japan
          </span>
        </Link>
        <div className="flex min-w-0 items-center gap-2">
          <PublicNavLinks memberSignupEnabled={memberSignupEnabled} />
          <MobileNavMenu memberSignupEnabled={memberSignupEnabled} />
        </div>
      </div>
    </nav>
  );
}
