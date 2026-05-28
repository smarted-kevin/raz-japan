"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, History, LayoutDashboard, User } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "~/components/ui/sheet";
import { useTranslations } from "next-intl";
import { authClient } from "~/lib/auth-client";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { SignOutButton } from "~/components/ui/auth/signOut";
import {
  publicCtaBlueOutlineButtonClassName,
  publicCtaYellowButtonClassName,
  publicMobileNavLinkUniformClassName,
} from "~/lib/public-cta-styles";
import { cn } from "~/lib/utils";
import { PublicLocaleSwitcher } from "./publicLocaleSwitcher";

export function MobileNavMenu() {
  const [open, setOpen] = useState(false);
  const { data: session } = authClient.useSession();
  const t = useTranslations("Homepage");

  const user_id = useQuery(
    api.queries.users.getUserRoleByAuthId,
    session ? { userId: session.user.id } : "skip"
  );

  const links = [
    { name: t("home"), href: "/" },
    { name: t("getting_started"), href: "/getting-started" },
    { name: t("about"), href: "/#about" },
    { name: t("contact"), href: "/contact" },
  ];

  const handleLinkClick = () => setOpen(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden text-slate-600 hover:bg-blue-50 hover:text-blue-700"
          aria-label="Open navigation menu"
        >
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-72">
        <SheetHeader>
          <SheetTitle className="sr-only">Navigation menu</SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col gap-1 pt-6">
          {links.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              onClick={handleLinkClick}
              className={publicMobileNavLinkUniformClassName}
            >
              {link.name}
            </Link>
          ))}

          <div className="flex items-center px-3 py-1">
            <PublicLocaleSwitcher />
          </div>

          <div className="my-2 border-t" />

          {!session ? (
            <>
              <Button
                asChild
                className={cn(
                  "w-full justify-start gap-3",
                  publicCtaYellowButtonClassName,
                )}
              >
                <Link href="/sign-up" onClick={handleLinkClick}>
                  <User className="h-4 w-4" />
                  {t("sign_up_button")}
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className={cn(
                  "w-full justify-start gap-3",
                  publicCtaBlueOutlineButtonClassName,
                )}
              >
                <Link href="/sign-in" onClick={handleLinkClick}>
                  {t("login_button")}
                </Link>
              </Button>
            </>
          ) : (
            <>
              <Link
                href={
                  user_id
                    ? user_id.role === "user"
                      ? `/dashboard/members/${user_id.user_id}`
                      : "/dashboard/admin"
                    : "/dashboard"
                }
                onClick={handleLinkClick}
                className={publicMobileNavLinkUniformClassName}
              >
                <LayoutDashboard className="h-4 w-4" />
                Go to Dashboard
              </Link>
              {user_id?.role === "user" && (
                <Link
                  href={`/dashboard/members/${user_id.user_id}/order-history`}
                  onClick={handleLinkClick}
                  className={publicMobileNavLinkUniformClassName}
                >
                  <History className="h-4 w-4" />
                  Order History
                </Link>
              )}
              <div className="mt-2">
                <SignOutButton />
              </div>
            </>
          )}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
