import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { publicSiteContainerClassName } from "~/lib/public-layout";
import { cn } from "~/lib/utils";
import { PublicNavLinks } from "./publicNavLinks";
import { MobileNavMenu } from "./mobileNavMenu";
import { isMemberSignupEnabled } from "~/lib/member-signup";
import { LANDING_IMAGES } from "~/lib/landing-images";

type PublicNavBarProps = {
  branded?: boolean;
  showAudienceBanner?: boolean;
};

export function PublicNavBar({
  branded = false,
  showAudienceBanner = true,
}: PublicNavBarProps) {
  const t = useTranslations("Homepage");
  const memberSignupEnabled = isMemberSignupEnabled();

  return (
    <header className="border-border bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 w-full border-b backdrop-blur">
      <nav
        className={cn(
          publicSiteContainerClassName,
          "flex h-16 items-center justify-between gap-2",
        )}
      >
        <Link
          href="/"
          className="group flex shrink-0 items-end gap-2.5 transition-opacity hover:opacity-90"
        >
          <Image
            src={LANDING_IMAGES.razPlusLogo}
            alt="Raz-Plus"
            width={4484}
            height={1172}
            sizes="(min-width: 640px) 128px, 80px"
            className="h-auto w-20 shrink-0 sm:w-32"
          />
          <span
            className={cn(
              "bg-gradient-to-r bg-clip-text text-sm leading-none font-bold tracking-tight whitespace-nowrap text-transparent sm:text-xl sm:leading-none",
              branded
                ? "from-[#651348] via-[#92206c] to-[#c83192]"
                : "from-blue-950 via-blue-900 to-indigo-700",
            )}
          >
            Japan
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
      </nav>
      {showAudienceBanner && (
        <div className="border-border border-t bg-gradient-to-br from-[#fff2f9] via-[#fbe8f4] to-[#f3c7e2]">
          <div
            className={cn(
              publicSiteContainerClassName,
              "flex items-center justify-between gap-4 py-2 text-xs sm:text-sm",
            )}
          >
            <p className="text-muted-foreground min-w-0">
              {t("individual_customers_website")}
            </p>
            <a
              href="https://learninga-z.jp"
              className={cn(
                "focus-visible:ring-ring shrink-0 rounded-sm font-medium underline underline-offset-4 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
                branded
                  ? "text-[#a92379] hover:text-[#861b61]"
                  : "text-blue-900 hover:text-blue-700",
              )}
            >
              {t("for_schools")}
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
