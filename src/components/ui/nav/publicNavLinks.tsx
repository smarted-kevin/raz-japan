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

export function PublicNavLinks() {

  const { data: session } = authClient.useSession();

  const t = useTranslations("Homepage");
  const links = [
    { name: t("home"), href: "/" },
    { name: t("getting_started"), href: "/getting-started" },
    { name: t("about"), href: "/#about" },
    { name: t("contact"), href: "/contact" }
  ];

  return (
    <div className="hidden min-w-0 items-center gap-3 md:flex lg:gap-6">
      {links.map((link) => (
        <Link
          key={link.name}
          href={link.href}
          className={publicNavLinkUniformClassName}
        >
          {link.name}
        </Link>
      ))}
      <PublicLocaleSwitcher />
      { !session &&
        <>
          <Link
            href="/sign-up"
            className={buttonVariants({
              size: "sm",
              className: cn("ml-2", publicCtaYellowButtonClassName),
            })}
          >
            {t("sign_up_button")}
          </Link>
          <Link
            href="/sign-in"
            className={buttonVariants({
              size: "sm",
              variant: "outline",
              className: cn("ml-2", publicCtaBlueOutlineButtonClassName),
            })}
          >
            {t("login_button")}
          </Link>
        </> 
      }
      { session &&
        <UserDropdown user={session.user.id}/>
      }
    </div>

  );
}