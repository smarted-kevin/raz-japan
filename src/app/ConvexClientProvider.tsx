"use client";

import { type ReactNode } from "react";
import { ConvexReactClient } from "convex/react";
import { authClient } from "~/lib/auth-client";
import { ConvexBetterAuthProvider } from "@convex-dev/better-auth/react";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!, {
  // Optionally pause queries until the user is authenticated
  expectAuth: true,
});

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  // Mount only in RootLayout: a nested provider's cleanup clears auth on this
  // shared client when navigating away, including for queries outside its tree.
  return (
    <ConvexBetterAuthProvider client={convex} authClient={authClient}>
      {children}
    </ConvexBetterAuthProvider>
  );
}
