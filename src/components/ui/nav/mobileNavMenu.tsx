"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, History, LayoutDashboard, User } from "lucide-react";
import { Button, buttonVariants } from "~/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "~/components/ui/sheet";
import { useTranslations } from "next-intl";
import { authClient } from "~/lib/auth-client";
import { useConvexAuth, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { SignOutButton } from "~/components/ui/auth/signOut";
import {
  publicCtaBlueOutlineButtonClassName,
  publicCtaYellowButtonClassName,
  publicMobileNavLinkUniformClassName,
} from "~/lib/public-cta-styles";
import { cn } from "~/lib/utils";
import { PublicLocaleSwitcher } from "./publicLocaleSwitcher";

type MobileNavMenuProps = {
  memberSignupEnabled: boolean;
  branded?: boolean;
};

export function MobileNavMenu({
  memberSignupEnabled,
  branded = false,
}: MobileNavMenuProps) {
  const [open, setOpen] = useState(false);
  const { data: session } = authClient.useSession();
  const { isAuthenticated } = useConvexAuth();
  const t = useTranslations("Homepage");

  const user_id = useQuery(
    api.queries.users.getUserRoleByAuthId,
    session && isAuthenticated ? { userId: session.user.id } : "skip",
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
          className={cn(
            "text-slate-600 min-[1001px]:hidden",
            branded
              ? "hover:bg-[#fbe8f4] hover:text-[#a92379]"
              : "hover:bg-blue-50 hover:text-blue-700",
          )}
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
              className={cn(
                publicMobileNavLinkUniformClassName,
                branded && "hover:bg-[#fbe8f4]/70 hover:text-[#861b61]",
              )}
            >
              {link.name}
            </Link>
          ))}

          <div className="flex items-center px-3 py-1">
            <PublicLocaleSwitcher branded={branded} />
          </div>

          <div className="my-2 border-t" />

          {!session ? (
            <>
              <Link
                href="/sign-up"
                onClick={handleLinkClick}
                className={buttonVariants({
                  variant: branded ? "ghost" : "default",
                  className: cn(
                    "w-full justify-start gap-3",
                    branded
                      ? "bg-[#c83192] font-semibold text-white shadow-lg shadow-[#c83192]/25 hover:bg-[#a92379]"
                      : publicCtaYellowButtonClassName,
                  ),
                })}
              >
                <User className="h-4 w-4" />
                {t(
                  memberSignupEnabled
                    ? "sign_up_button"
                    : "member_signup_coming_soon",
                )}
              </Link>
              <Link
                href="/sign-in"
                onClick={handleLinkClick}
                className={buttonVariants({
                  variant: "outline",
                  className: cn(
                    "w-full justify-start gap-3",
                    branded
                      ? "border-2 border-[#c83192] bg-white text-[#a92379] shadow-xs hover:bg-[#fbe8f4] hover:text-[#861b61]"
                      : publicCtaBlueOutlineButtonClassName,
                  ),
                })}
              >
                {t("login_button")}
              </Link>
            </>
          ) : (
            <>
              <Link
                href={
                  user_id
                    ? user_id.role === "user"
                      ? "/dashboard/members"
                      : "/dashboard/admin"
                    : "/dashboard"
                }
                onClick={handleLinkClick}
                className={cn(
                  publicMobileNavLinkUniformClassName,
                  branded && "hover:bg-[#fbe8f4]/70 hover:text-[#861b61]",
                )}
              >
                <LayoutDashboard className="h-4 w-4" />
                Go to Dashboard
              </Link>
              {user_id?.role === "user" && (
                <Link
                  href={"/dashboard/members/order-history"}
                  onClick={handleLinkClick}
                  className={cn(
                    publicMobileNavLinkUniformClassName,
                    branded && "hover:bg-[#fbe8f4]/70 hover:text-[#861b61]",
                  )}
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
