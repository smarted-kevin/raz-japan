import type { CaptureResult, PostHog } from "posthog-js";
import { analyticsVisitorId, approvedCampaign } from "./analytics-context";

const consentKey = "raz-japan:analytics-consent";
const visitorKey = "raz-japan:analytics-visitor";
const token = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;
export const analyticsEnabled = Boolean(
  token &&
    /^phc_[A-Za-z0-9]+$/.test(token) &&
    (host === "https://eu.i.posthog.com" ||
      host === "https://us.i.posthog.com"),
);

export type AnalyticsConsent =
  | "allowed"
  | "declined"
  | "undecided"
  | "unavailable";
type CheckoutType = "annual" | "monthly";
type AnalyticsEvent =
  | { name: "landing_page_viewed" | "get_started_clicked" | "signup_completed" }
  | { name: "checkout_started"; checkoutType: CheckoutType };

export function readAnalyticsConsent(): AnalyticsConsent {
  if (storageWriteFailed) return "unavailable";
  try {
    const value = window.localStorage.getItem(consentKey);
    return value === "allowed" || value === "declined" ? value : "undecided";
  } catch {
    return "unavailable";
  }
}

export function rememberAnalyticsConsent(choice: "allowed" | "declined") {
  try {
    window.localStorage.setItem(consentKey, choice);
  } catch {
    // A failed write must not leave this tab capturing on an older choice.
    storageWriteFailed = true;
    return "unavailable";
  }
  storageWriteFailed = false;
  if (choice === "declined") resetAnalyticsIdentity();
  return choice;
}

export function resetAnalyticsIdentity() {
  try {
    window.localStorage.removeItem(visitorKey);
  } catch {
    storageWriteFailed = true;
  }
}

export function isAnalyticsPublicPath(path: string) {
  return path === "/" || path === "/getting-started" || path === "/sign-up";
}

function readVisitor() {
  if (storageWriteFailed || readAnalyticsConsent() !== "allowed") return;
  try {
    const stored = window.localStorage.getItem(visitorKey);
    if (!stored) return;
    const value: unknown = JSON.parse(stored);
    if (!value || typeof value !== "object" || !("id" in value)) return;
    if (typeof value.id !== "string" || !analyticsVisitorId.test(value.id))
      return;
    const campaign = "campaign" in value ? value.campaign : null;
    return {
      id: value.id,
      campaign: approvedCampaign((key) =>
        campaign && typeof campaign === "object" && key in campaign
          ? (campaign as Record<string, unknown>)[key]
          : undefined,
      ),
    };
  } catch {
    return;
  }
}

let storageWriteFailed = false;

function prepareVisitor() {
  if (
    !analyticsEnabled ||
    storageWriteFailed ||
    readAnalyticsConsent() !== "allowed"
  )
    return;
  try {
    const existing = readVisitor();
    if (existing && Object.keys(existing.campaign).length > 0) return existing;
    const query = new URLSearchParams(window.location.search);
    const visitor = {
      id: existing?.id ?? window.crypto.randomUUID(),
      campaign: isAnalyticsPublicPath(window.location.pathname)
        ? approvedCampaign((key) => query.get(key))
        : {},
    };
    if (!existing || Object.keys(visitor.campaign).length > 0) {
      window.localStorage.setItem(visitorKey, JSON.stringify(visitor));
    }
    return visitor;
  } catch {
    return;
  }
}

function filterEvent(event: CaptureResult | null): CaptureResult | null {
  const visitor = readVisitor();
  if (
    !event ||
    !visitor ||
    !token ||
    event.properties.analytics_visitor_id !== visitor.id
  )
    return null;
  const locale: unknown = event.properties.locale;
  if (locale !== "en" && locale !== "ja") return null;

  const properties = {
    token, // Public project token required by the ingestion endpoint.
    distinct_id: visitor.id,
    $process_person_profile: false,
    $geoip_disable: true,
    locale,
    ...visitor.campaign,
  };
  const { uuid, timestamp, event: name } = event;
  switch (name) {
    case "landing_page_viewed":
    case "get_started_clicked":
      return {
        uuid,
        timestamp,
        event: name,
        properties: { ...properties, page: "landing" },
      };
    case "signup_completed":
      return {
        uuid,
        timestamp,
        event: name,
        properties: { ...properties, page: "signup" },
      };
    case "checkout_started": {
      const checkoutType: unknown = event.properties.checkout_type;
      if (checkoutType !== "annual" && checkoutType !== "monthly") return null;
      return {
        uuid,
        timestamp,
        event: name,
        properties: { ...properties, checkout_type: checkoutType },
      };
    }
    default:
      return null;
  }
}

let client: PostHog | undefined;
let loading: Promise<void> | undefined;
function loadClient() {
  loading ??= import("posthog-js")
    .then(({ default: posthog }) => {
      if (!readVisitor() || !token || !host) return;
      posthog.init(token, {
        api_host: host,
        persistence: "memory",
        person_profiles: "never",
        autocapture: false,
        capture_pageview: false,
        capture_pageleave: false,
        capture_dead_clicks: false,
        rageclick: false,
        capture_exceptions: false,
        capture_heatmaps: false,
        capture_performance: false,
        disableDeviceModel: true,
        disable_session_recording: true,
        disable_surveys: true,
        disable_product_tours: true,
        disable_conversations: true,
        advanced_disable_flags: true,
        disable_external_dependency_loading: true,
        save_campaign_params: false,
        save_referrer: false,
        request_batching: false,
        before_send: filterEvent,
      });
      client = posthog;
    })
    .finally(() => {
      loading = undefined;
    });
  return loading;
}

export function prepareAnalytics() {
  if (prepareVisitor() && !client) void loadClient().catch(() => {});
}

export function checkoutAnalyticsContext(locale: string):
  | ({
      project_token: string;
      distinct_id: string;
      locale: "en" | "ja";
    } & ReturnType<typeof approvedCampaign>)
  | undefined {
  if (!token || (locale !== "en" && locale !== "ja")) return;
  const visitor = prepareVisitor();
  if (visitor) {
    return {
      project_token: token,
      distinct_id: visitor.id,
      locale,
      ...visitor.campaign,
    };
  }
}

export function captureAnalytics(event: AnalyticsEvent, locale: string) {
  const path = window.location.pathname;
  const eligible =
    event.name === "checkout_started"
      ? path ===
        (event.checkoutType === "annual"
          ? "/dashboard/members/order"
          : "/dashboard/members/subscriptions/add")
      : path === (event.name === "signup_completed" ? "/sign-up" : "/");
  if (!eligible || (locale !== "en" && locale !== "ja")) return;
  const visitor = prepareVisitor();
  if (!visitor) return;

  const send = () => {
    try {
      client?.capture(
        event.name,
        {
          analytics_visitor_id: visitor.id,
          locale,
          ...(event.name === "checkout_started"
            ? { checkout_type: event.checkoutType }
            : {}),
        },
        { send_instantly: true, transport: "sendBeacon" },
      );
    } catch {
      // Analytics must not interrupt the user's action.
    }
  };
  if (client) send();
  else
    return loadClient()
      .then(send)
      .catch(() => {});
}

export async function captureCheckoutStarted(
  url: string,
  checkoutType: CheckoutType,
  locale: string,
) {
  try {
    // Keep analytics tied to a real Stripe Checkout redirect.
    if (new URL(url).origin === "https://checkout.stripe.com") {
      const pending = captureAnalytics(
        { name: "checkout_started", checkoutType },
        locale,
      );
      if (pending) {
        // Let a cold SDK queue the beacon without leaving checkout waiting indefinitely.
        let timer: ReturnType<typeof setTimeout> | undefined;
        try {
          await Promise.race([
            pending,
            new Promise<void>((resolve) => {
              timer = setTimeout(resolve, 500);
            }),
          ]);
        } finally {
          clearTimeout(timer);
        }
      }
    }
  } catch {
    // Invalid URLs are handled by the checkout flow itself.
  }
}
