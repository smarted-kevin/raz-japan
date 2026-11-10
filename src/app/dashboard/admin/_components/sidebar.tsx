"use client";

import { useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "~/components/ui/button";
import SidebarNav from "./sidebarNav";
import DashboardLocaleSwitcher from "../../dashboardLocaleSwitcher";
import { SignOutButton } from "~/components/ui/auth/signOut";
import { useSidebar } from "./sidebarContext";
import { cn } from "~/lib/utils";

type UserRole = "user" | "admin" | "org_admin" | "god";

interface SidebarProps {
  role: UserRole;
}

export default function Sidebar({ role }: SidebarProps) {
  const t = useTranslations("dashboard.admin.layout");
  const { isCollapsed, setIsCollapsed } = useSidebar();

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed, true); // Pass true to indicate manual toggle
  };

  return (
    <aside
      className={cn(
        "bg-primary fixed top-0 left-0 z-40 flex h-screen flex-col transition-all duration-300 print:hidden",
        isCollapsed ? "w-16" : "w-64",
      )}
    >
      {/* Header */}
      <div
        className={cn(
          "border-primary-foreground/10 flex h-16 items-center border-b transition-all duration-300",
          isCollapsed ? "justify-center px-0" : "justify-between px-6",
        )}
      >
        <h2
          aria-hidden={isCollapsed}
          className={cn(
            "overflow-hidden text-lg font-semibold whitespace-nowrap text-white transition-[opacity,visibility] duration-0",
            isCollapsed
              ? "invisible w-0 opacity-0 delay-0"
              : "visible opacity-100 delay-300",
          )}
        >
          {t("title")}
        </h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleCollapse}
          className={cn(
            "text-white hover:bg-white/20",
            isCollapsed ? "mx-auto" : "ml-auto",
          )}
          aria-label={isCollapsed ? t("expand_sidebar") : t("collapse_sidebar")}
        >
          {isCollapsed ? (
            <ChevronRight className="h-5 w-5" />
          ) : (
            <ChevronLeft className="h-5 w-5" />
          )}
        </Button>
      </div>

      {/* Language Toggle and Logout - Moved Higher */}
      <div
        className={cn(
          "border-primary-foreground/10 border-b p-3",
          isCollapsed
            ? "flex flex-col items-center gap-2"
            : "flex items-center justify-between gap-3 px-4",
        )}
      >
        <DashboardLocaleSwitcher collapsed={isCollapsed} />
        <SignOutButton collapsed={isCollapsed} />
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto">
        <SidebarNav role={role} collapsed={isCollapsed} />
      </div>
    </aside>
  );
}
