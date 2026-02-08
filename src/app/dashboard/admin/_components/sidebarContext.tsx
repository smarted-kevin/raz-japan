"use client";

import { createContext, useContext, useState, useEffect, useRef, type ReactNode } from "react";

interface SidebarContextType {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean, manual?: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [isCollapsed, setIsCollapsedState] = useState(false);
  const isManualCollapse = useRef(false);
  const hasInitialized = useRef(false);

  // Wrapper to track manual collapses
  const setIsCollapsed = (collapsed: boolean, manual = false) => {
    if (manual) {
      // User manually toggled - track the collapsed state
      isManualCollapse.current = collapsed;
    }
    setIsCollapsedState(collapsed);
  };

  useEffect(() => {
    // Set initial state based on screen size
    const checkScreenSize = () => {
      const isSmallScreen = window.innerWidth < 1024; // lg breakpoint (1024px)
      
      if (!hasInitialized.current) {
        // First load: set initial state based on screen size
        setIsCollapsedState(isSmallScreen);
        isManualCollapse.current = false;
        hasInitialized.current = true;
      } else {
        // After initialization: only auto-collapse when screen gets too small
        // Don't auto-expand if it was manually collapsed
        setIsCollapsedState((currentCollapsed) => {
          if (isSmallScreen && !currentCollapsed) {
            // Screen got too small and sidebar is expanded, auto-collapse
            // Don't mark as manual since this is automatic
            return true;
          } else if (!isSmallScreen) {
            // Screen is large enough
            if (isManualCollapse.current) {
              // Was manually collapsed, keep it collapsed
              return currentCollapsed;
            } else {
              // Wasn't manually collapsed, expand it
              return false;
            }
          }
          return currentCollapsed;
        });
      }
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  return (
    <SidebarContext.Provider value={{ isCollapsed, setIsCollapsed }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
}
