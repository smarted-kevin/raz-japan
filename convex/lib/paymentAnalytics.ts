import { v } from "convex/values";
import type { Infer } from "convex/values";
import { internal } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";
import {
  analyticsVisitorId,
  approvedCampaign,
} from "../../src/lib/analytics-context";

export const paymentAnalyticsContext = v.object({
  project_token: v.string(),
  distinct_id: v.string(),
  locale: v.union(v.literal("en"), v.literal("ja")),
  utm_source: v.optional(v.string()),
  utm_medium: v.optional(v.string()),
  utm_campaign: v.optional(v.string()),
});

export const checkoutType = v.union(v.literal("annual"), v.literal("monthly"));
const annualOrderType = v.union(
  v.literal("new"),
  v.literal("renewal"),
  v.literal("reactivation"),
  v.literal("mixed"),
);
export const analyticsCheckoutId = v.union(
  v.id("full_order"),
  v.id("monthly_checkout_batch"),
);

type Attribution = Infer<typeof paymentAnalyticsContext>;
type CheckoutId = Infer<typeof analyticsCheckoutId>;

function configuredProject() {
  const token = process.env.POSTHOG_PAYMENT_PROJECT_TOKEN;
  const host = process.env.POSTHOG_PAYMENT_HOST;
  if (
    token &&
    /^phc_[A-Za-z0-9]+$/.test(token) &&
    (host === "https://us.i.posthog.com" || host === "https://eu.i.posthog.com")
  )
    return { token, host };
}

function validatedAttribution(attribution: Attribution | undefined) {
  const project = configuredProject();
  if (
    !project ||
    !attribution ||
    attribution.project_token !== project.token ||
    !analyticsVisitorId.test(attribution.distinct_id)
  )
    return;
  return {
    project_token: project.token,
    distinct_id: attribution.distinct_id,
    locale: attribution.locale,
    ...approvedCampaign((key) => attribution[key]),
  };
}

function checkoutAttribution(ctx: MutationCtx, id: CheckoutId) {
  return ctx.db
    .query("payment_analytics_context")
    .withIndex("by_checkout", (q) => q.eq("checkout_id", id))
    .first();
}

export async function savePaymentAttribution(
  ctx: MutationCtx,
  id: CheckoutId,
  input?: Attribution,
) {
  const attribution = validatedAttribution(input);
  const existing = await checkoutAttribution(ctx, id);
  if (existing) {
    if (attribution) await ctx.db.patch(existing._id, { attribution });
    else await ctx.db.delete(existing._id);
  } else if (attribution) {
    await ctx.db.insert("payment_analytics_context", {
      checkout_id: id,
      attribution,
    });
  }
}

export async function clearPaymentAttribution(
  ctx: MutationCtx,
  id: CheckoutId,
) {
  const existing = await checkoutAttribution(ctx, id);
  if (existing) await ctx.db.delete(existing._id);
}

export async function schedulePaymentConfirmed(
  ctx: MutationCtx,
  id: CheckoutId,
  orderId: Id<"full_order">,
  type: Infer<typeof checkoutType>,
  amount: number,
  paidAt: number,
  annualType?: Infer<typeof annualOrderType>,
) {
  const existing = await checkoutAttribution(ctx, id);
  if (!existing) return;
  await ctx.db.delete(existing._id);
  const attribution = validatedAttribution(existing.attribution);
  if (!attribution || amount <= 0) return;
  // Scheduled transactionally with the first verified payment transition.
  await ctx.scheduler.runAfter(0, internal.stripe.sendPaymentConfirmed, {
    order_id: orderId,
    checkout_type: type,
    annual_order_type: annualType,
    paid_at: paidAt,
    attribution,
    attempt: 0,
  });
}

export const paymentConfirmedArgs = {
  order_id: v.id("full_order"),
  checkout_type: checkoutType,
  annual_order_type: v.optional(annualOrderType),
  paid_at: v.number(),
  attribution: paymentAnalyticsContext,
  attempt: v.number(),
};

async function paymentEventId(orderId: Id<"full_order">) {
  const digest = new Uint8Array(
    await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(`raz-japan:payment_confirmed:${orderId}`),
    ),
  ).slice(0, 16);
  digest[6] = (digest[6]! & 0x0f) | 0x80; // RFC 9562 custom UUID
  digest[8] = (digest[8]! & 0x3f) | 0x80;
  const hex = Array.from(digest, (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export async function sendPaymentConfirmedEvent(args: {
  order_id: Id<"full_order">;
  checkout_type: Infer<typeof checkoutType>;
  annual_order_type?: Infer<typeof annualOrderType>;
  paid_at: number;
  attribution: Attribution;
}): Promise<"done" | "retry" | "rejected"> {
  const project = configuredProject();
  const attribution = validatedAttribution(args.attribution);
  if (!project || !attribution) return "done";
  const { distinct_id, locale, utm_source, utm_medium, utm_campaign } =
    attribution;
  const payload = {
    api_key: project.token,
    event: "payment_confirmed",
    uuid: await paymentEventId(args.order_id),
    timestamp: new Date(args.paid_at).toISOString(),
    properties: {
      distinct_id,
      locale,
      utm_source,
      utm_medium,
      utm_campaign,
      checkout_type: args.checkout_type,
      annual_order_type: args.annual_order_type,
      $geoip_disable: true,
      $process_person_profile: false,
    },
  };
  try {
    const response = await fetch(`${project.host}/i/v0/e/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10_000),
      redirect: "error",
    });
    if (
      response.status === 408 ||
      response.status === 429 ||
      response.status >= 500
    )
      return "retry";
    return response.ok ? "done" : "rejected";
  } catch {
    return "retry";
  }
}
