"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useAction } from "convex/react";
import { useTranslations } from "next-intl";
import { api } from "@/convex/_generated/api";

export function MemberCheckoutCleanup({ children }: { children: ReactNode }) {
  const abandon = useAction(api.subscriptions.abandonMonthlyCheckouts);
  const t = useTranslations("billing");
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let mounted = true;
    async function clearCheckout() {
      setState("loading");
      try {
        await abandon({});
        if (mounted) setState("ready");
      } catch {
        if (mounted) setState("error");
      }
    }
    function onPageShow(event: PageTransitionEvent) {
      if (event.persisted) void clearCheckout();
    }
    void clearCheckout();
    window.addEventListener("pageshow", onPageShow);
    return () => {
      mounted = false;
      window.removeEventListener("pageshow", onPageShow);
    };
  }, [abandon]);

  if (state === "loading") return <p role="status">{t("loading")}</p>;
  if (state === "error") return <p role="alert">{t("action_error")}</p>;
  return children;
}
