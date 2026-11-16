"use client";

import { type ReactNode, useEffect, useRef } from "react";
import { ConvexReactClient } from "convex/react";
import posthog from "posthog-js";
import { authClient } from "~/lib/auth-client";
import { ConvexBetterAuthProvider } from "@convex-dev/better-auth/react";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!, {
  // Optionally pause queries until the user is authenticated
  expectAuth: true,
});

function PostHogIdentity() {
  const { data: session, isPending } = authClient.useSession();
  const previousUserId = useRef<string | null>(null);

  useEffect(() => {
    if (isPending) return;

    const user = session?.user;

    if (!user) {
      if (previousUserId.current) {
        posthog.reset();
        previousUserId.current = null;
      }
      return;
    }

    if (previousUserId.current && previousUserId.current !== user.id) {
      posthog.reset();
    }

    if (previousUserId.current !== user.id) {
      posthog.identify(user.id, {
        email: user.email,
        name: user.name,
        role: user.role,
      });
      previousUserId.current = user.id;
    }
  }, [isPending, session]);

  return null;
}

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  // Mount only in RootLayout: a nested provider's cleanup clears auth on this
  // shared client when navigating away, including for queries outside its tree.
  return (
    <ConvexBetterAuthProvider client={convex} authClient={authClient}>
      <PostHogIdentity />
      {children}
    </ConvexBetterAuthProvider>
  );
}
