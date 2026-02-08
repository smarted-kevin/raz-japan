"use client";

import { useState, useEffect } from "react";
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
  const { isCollapsed, setIsCollapsed } = useSidebar();
  const [showTitle, setShowTitle] = useState(!isCollapsed);

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed, true); // Pass true to indicate manual toggle
  };

  // Delay showing title until after transition completes
  useEffect(() => {
    if (isCollapsed) {
      // Hide immediately when collapsing
      setShowTitle(false);
    } else {
      // Show after transition completes (300ms)
      const timer = setTimeout(() => {
        setShowTitle(true);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isCollapsed]);

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-primary flex flex-col transition-all duration-300",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      {/* Header */}
      <div
        className={cn(
          "flex h-16 items-center border-b border-primary-foreground/10 transition-all duration-300",
          isCollapsed ? "justify-center px-0" : "justify-between px-6"
        )}
      >
        {showTitle && !isCollapsed && (
          <h2 className="text-lg font-semibold text-white">Admin Dashboard</h2>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleCollapse}
          className={cn(
            "text-white hover:bg-white/20",
            isCollapsed ? "mx-auto" : "ml-auto"
          )}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? (
            <ChevronRight className="h-5 w-5" />
          ) : (
            <ChevronLeft className="h-5 w-5" />
          )}
        </Button>
      </div>

      {/* Language Toggle and Logout - Moved Higher */}
      <div className={cn(
        "border-b border-primary-foreground/10 p-3",
        isCollapsed ? "flex flex-col items-center gap-2" : "flex items-center justify-between gap-3 px-4"
      )}>
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
