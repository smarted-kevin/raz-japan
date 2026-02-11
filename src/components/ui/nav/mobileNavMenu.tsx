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
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { authClient } from "~/lib/auth-client";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { SignOutButton } from "~/components/ui/auth/signOut";
import { cn } from "~/lib/utils";

export function MobileNavMenu() {
  const [open, setOpen] = useState(false);
  const { data: session } = authClient.useSession();
  const pathname = usePathname();
  const t = useTranslations("Homepage");

  const user_id = useQuery(
    api.queries.users.getUserRoleByAuthId,
    session ? { userId: session.user.id } : "skip"
  );

  const links = [
    { name: t("home"), href: "/" },
    { name: t("getting_started"), href: "/" },
    { name: t("about"), href: "/" },
    { name: t("contact"), href: "/" },
  ];

  const handleLinkClick = () => setOpen(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
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
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                pathname === link.href
                  ? "bg-accent text-accent-foreground"
                  : "text-foreground"
              )}
            >
              {link.name}
            </Link>
          ))}

          <div className="my-2 border-t" />

          {!session ? (
            <>
              <Link href="/sign-up" onClick={handleLinkClick}>
                <Button variant="default" className="w-full justify-start gap-3">
                  <User className="h-4 w-4" />
                  {t("sign_up_button")}
                </Button>
              </Link>
              <Link href="/sign-in" onClick={handleLinkClick}>
                <Button variant="outline" className="w-full justify-start gap-3">
                  {t("login_button")}
                </Button>
              </Link>
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
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                <LayoutDashboard className="h-4 w-4" />
                Go to Dashboard
              </Link>
              {user_id?.role === "user" && (
                <Link
                  href={`/dashboard/members/${user_id.user_id}/order-history`}
                  onClick={handleLinkClick}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
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
