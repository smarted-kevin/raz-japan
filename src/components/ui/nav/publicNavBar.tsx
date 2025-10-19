"use client";

import DashboardLocaleSwitcher from "~/app/dashboard/dashboardLocaleSwitcher";
import Link from "next/link";
import { Button } from "~/components/ui/button";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { BookOpen } from "lucide-react";
import { PublicNavLinks } from "./publicNavLinks";
import { SignOutButton } from "~/components/ui/auth/signOut";

export function PublicNavBar() {

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: "smooth" })
    }
  }

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
            <BookOpen className="h-6 w-6 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold text-foreground">Raz-Japan</span>
        </Link>
        <PublicNavLinks/>
        <Button size="sm" className="md:hidden">
          Sign Up
        </Button>
      </div>
    </nav>
  );
}