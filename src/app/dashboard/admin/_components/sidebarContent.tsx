"use client";

import { useSidebar } from "./sidebarContext";
import { cn } from "~/lib/utils";

export function SidebarContent({ children }: { children: React.ReactNode }) {
  const { isCollapsed } = useSidebar();

  return (
    <main
      className={cn(
        "flex-1 overflow-y-auto pt-16 md:pt-0 transition-all duration-300",
        isCollapsed ? "md:pl-16" : "md:pl-64"
      )}
    >
      {children}
    </main>
  );
}
