"use client";

import Link from "next/link";
import { BookOpen } from "lucide-react";
import { PublicNavLinks } from "./publicNavLinks";
import { MobileNavMenu } from "./mobileNavMenu";

export function PublicNavBar() {
  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between gap-2 px-4">
        <Link
          href="/"
          className="group flex shrink-0 items-center gap-2.5 transition-opacity hover:opacity-90"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 shadow-md shadow-blue-600/25 ring-1 ring-blue-500/20 transition-shadow group-hover:shadow-lg group-hover:shadow-blue-600/30">
            <BookOpen
              className="h-6 w-6 text-white"
              aria-hidden
              strokeWidth={2}
            />
          </div>
          <span className="whitespace-nowrap bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-700 bg-clip-text text-xl font-bold tracking-tight text-transparent">
            Raz-Japan
          </span>
        </Link>
        <div className="flex min-w-0 items-center gap-2">
          <PublicNavLinks />
          <MobileNavMenu />
        </div>
      </div>
    </nav>
  );
}