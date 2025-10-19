"use client";

import Link from "next/link";
import { Button } from "~/components/ui/button";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { BookOpen } from "lucide-react";

export function PublicNavLinks() {

  const pathname = usePathname();
  const t = useTranslations("Homepage");
  const links = [
    { name: t("home"), href: "/" },
    { name: t("getting_started"), href: "/" },
    { name: t("about"), href: "/" },
    { name: t("contact"), href: "/" }
  ];

  return (
    <div className="hidden items-center gap-6 md:flex">
      {links.map((link) => {
        return (
          <Link
            key={link.name}
            href={link.href}
            className={`${pathname == link.href ? "text-blue-900" : "text-blue-400" } text-sm font-medium text-foreground transition-colors hover:text-primary`}
          >
            <span className="text-lightgray">{link.name}</span>
          </Link>
        )
      })}
     
      <Button size="sm" className="ml-2">
        <Link href="/sign-in">
          {t("login_button")}
        </Link>
      </Button>
    </div>
  );
}