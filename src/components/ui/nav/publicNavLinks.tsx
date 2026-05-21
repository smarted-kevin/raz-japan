"use client";

import Link from "next/link";
import { Button } from "~/components/ui/button";
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
    <div className="hidden items-center gap-6 md:flex">
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
          <Button
            size="sm"
            className={cn("ml-2", publicCtaYellowButtonClassName)}
            asChild
          >
            <Link href="/sign-up">{t("sign_up_button")}</Link>
          </Button>
          <Button
            size="sm"
            variant="outline"
            className={cn("ml-2", publicCtaBlueOutlineButtonClassName)}
            asChild
          >
            <Link href="/sign-in">{t("login_button")}</Link>
          </Button>
        </> 
      }
      { session &&
        <UserDropdown user={session.user.id}/>
      }
    </div>

  );
}