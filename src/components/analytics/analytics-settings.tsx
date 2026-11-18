"use client";

import { useEffect, useId, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "~/components/ui/button";
import {
  type AnalyticsConsent,
  analyticsEnabled,
  captureAnalytics,
  isAnalyticsPublicPath,
  prepareAnalytics,
  readAnalyticsConsent,
  rememberAnalyticsConsent,
} from "~/lib/analytics";

export function AnalyticsSettings() {
  const path = usePathname();
  const locale = useLocale();
  const t = useTranslations("Analytics");
  const title = useId();
  const panel = useId();
  const settingsButton = useRef<HTMLButtonElement>(null);
  const landingCaptured = useRef(false);
  const [consent, setConsent] = useState<AnalyticsConsent | null>(null);
  const [editing, setEditing] = useState(false);
  const publicPage = isAnalyticsPublicPath(path);
  const memberPage =
    path === "/dashboard/members" || path.startsWith("/dashboard/members/");
  const visible = analyticsEnabled && (publicPage || memberPage);
  const prompt = consent === "undecided" && publicPage;
  const open = prompt || editing;

  useEffect(() => {
    if (!visible) return;
    const refresh = () => setConsent(readAnalyticsConsent());
    refresh();
    window.addEventListener("storage", refresh);
    window.addEventListener("pageshow", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("pageshow", refresh);
    };
  }, [visible]);

  useEffect(() => {
    if (path !== "/") landingCaptured.current = false;
    if (!visible || consent !== "allowed") return;
    if (
      publicPage ||
      path === "/dashboard/members/order" ||
      path === "/dashboard/members/subscriptions/add"
    ) {
      prepareAnalytics();
    }
    if (path === "/" && !landingCaptured.current) {
      landingCaptured.current = true;
      captureAnalytics({ name: "landing_page_viewed" }, locale);
    }
  }, [consent, locale, path, publicPage, visible]);

  useEffect(() => {
    if (!visible || path !== "/" || consent !== "allowed") return;
    const onClick = (event: MouseEvent) => {
      if (
        event.target instanceof Element &&
        event.target.closest('a[href="/getting-started"]')
      ) {
        captureAnalytics({ name: "get_started_clicked" }, locale);
      }
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [consent, locale, path, visible]);

  if (!visible || consent === null) return null;

  function close() {
    setEditing(false);
    settingsButton.current?.focus({ preventScroll: true });
  }

  function choose(choice: "allowed" | "declined") {
    const result = rememberAnalyticsConsent(choice);
    setConsent(result);
    if (result === "unavailable") setEditing(true);
    else close();
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-3 text-right">
      <Button
        ref={settingsButton}
        type="button"
        variant="link"
        size="sm"
        aria-expanded={open}
        aria-controls={open ? panel : undefined}
        onClick={() => setEditing(!editing)}
      >
        {t("settings")}
      </Button>
      {open && (
        <section
          id={panel}
          aria-labelledby={title}
          className="bg-background text-foreground fixed inset-x-4 bottom-4 z-40 mx-auto max-w-md rounded-xl border p-4 text-left shadow-lg sm:inset-x-auto sm:right-4"
        >
          <h2 id={title} className="text-base font-semibold">
            {t("title")}
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            {t("description")}
          </p>
          {consent === "unavailable" && (
            <p role="status" className="mt-2 text-sm">
              {t("unavailable")}
            </p>
          )}
          {editing && (consent === "allowed" || consent === "declined") && (
            <p className="mt-2 text-sm">
              {t(
                consent === "allowed"
                  ? "currently_allowed"
                  : "currently_declined",
              )}
            </p>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => choose("allowed")}
            >
              {t("allow")}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => choose("declined")}
            >
              {t("decline")}
            </Button>
            {editing && !prompt && (
              <Button type="button" variant="ghost" onClick={close}>
                {t("close")}
              </Button>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
