"use client";

import Link from "next/link";
import { buttonVariants } from "~/components/ui/button";
import {
  publicCtaBlueOutlineButtonClassName,
  publicCtaYellowButtonClassName,
  publicNavLinkUniformClassName,
} from "~/lib/public-cta-styles";
import { cn } from "~/lib/utils";
import { useTranslations } from "next-intl";
import { authClient } from "~/lib/auth-client";
import UserDropdown from "./userDropdown";
import { PublicLocaleSwitcher } from "./publicLocaleSwitcher";

type PublicNavLinksProps = {
  memberSignupEnabled: boolean;
  branded?: boolean;
};

export function PublicNavLinks({
  memberSignupEnabled,
  branded = false,
}: PublicNavLinksProps) {
  const { data: session } = authClient.useSession();

  const t = useTranslations("Homepage");
  const links = [
    { name: t("home"), href: "/" },
    { name: t("getting_started"), href: "/getting-started" },
    { name: t("about"), href: "/#about" },
    { name: t("contact"), href: "/contact" },
  ];

  return (
    <div className="hidden min-w-0 items-center gap-3 min-[1001px]:flex lg:gap-6">
      {links.map((link) => (
        <Link
          key={link.name}
          href={link.href}
          className={cn(
            publicNavLinkUniformClassName,
            branded && "hover:text-[#a92379]",
          )}
        >
          {link.name}
        </Link>
      ))}
      <PublicLocaleSwitcher branded={branded} />
      {!session && (
        <>
          <Link
            href="/sign-up"
            className={buttonVariants({
              size: "sm",
              variant: branded ? "ghost" : "default",
              className: cn(
                "ml-2",
                branded
                  ? "bg-[#c83192] font-semibold text-white shadow-lg shadow-[#c83192]/25 hover:bg-[#a92379]"
                  : publicCtaYellowButtonClassName,
              ),
            })}
          >
            {t(
              memberSignupEnabled
                ? "sign_up_button"
                : "member_signup_coming_soon",
            )}
          </Link>
          <Link
            href="/sign-in"
            className={buttonVariants({
              size: "sm",
              variant: "outline",
              className: cn(
                "ml-2",
                branded
                  ? "border-2 border-[#c83192] bg-white text-[#a92379] shadow-xs hover:bg-[#fbe8f4] hover:text-[#861b61]"
                  : publicCtaBlueOutlineButtonClassName,
              ),
            })}
          >
            {t("login_button")}
          </Link>
        </>
      )}
      {session && <UserDropdown user={session.user.id} />}
    </div>
  );
}
