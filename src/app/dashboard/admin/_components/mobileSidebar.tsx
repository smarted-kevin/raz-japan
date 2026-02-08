"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "~/components/ui/sheet";
import SidebarNav from "./sidebarNav";
import DashboardLocaleSwitcher from "../../dashboardLocaleSwitcher";
import { SignOutButton } from "~/components/ui/auth/signOut";

type UserRole = "user" | "admin" | "org_admin" | "god";

interface MobileSidebarProps {
  role: UserRole;
}

export default function MobileSidebar({ role }: MobileSidebarProps) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden text-white hover:bg-white/20"
          aria-label="Open menu"
        >
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0 bg-primary">
        <SheetHeader className="border-b border-primary-foreground/10 p-6">
          <SheetTitle className="text-white">Admin Dashboard</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col h-[calc(100vh-80px)]">
          <div className="flex-1 overflow-y-auto">
            <SidebarNav role={role} onLinkClick={() => setOpen(false)} />
          </div>
          <div className="border-t border-primary-foreground/10 p-4 space-y-3">
            <div className="flex justify-center">
              <DashboardLocaleSwitcher />
            </div>
            <SignOutButton />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
