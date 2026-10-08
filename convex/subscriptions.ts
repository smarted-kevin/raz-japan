"use node";

import type Stripe from "stripe";
import { v } from "convex/values";
import { action, internalAction } from "./_generated/server";
import type { ActionCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";
import { renewalStopAt } from "./lib/billing";
import { stripeClient, ensureCustomer } from "./lib/stripeBilling";

export const createMonthlyCheckout = action({
  args: { course_id: v.id("course"), student_id: v.id("student") },
  handler: async (
    ctx,
    args,
  ): Promise<{ url: string; attempt_id: Id<"monthly_checkout"> }> => {
    const payer = await ctx.runQuery(internal.billingStore.payer, {});
    const attempt = await ctx.runMutation(internal.billingStore.reserve, args);
    const stripe = stripeClient();
    try {
      const customer = await ensureCustomer(ctx, stripe, payer);
      let session: Stripe.Checkout.Session;
      if (attempt.stripe_session_id)
        session = await stripe.checkout.sessions.retrieve(
          attempt.stripe_session_id,
        );
      else {
        const price = await stripe.prices.retrieve(attempt.stripe_price_id);
        if (
          !price.active ||
          price.currency !== "jpy" ||
          price.unit_amount !== attempt.price ||
          price.recurring?.interval !== "month" ||
          price.recurring.interval_count !== 1
        )
          throw new Error("Monthly Stripe price mismatch");
        const metadata = { monthly_attempt_id: attempt._id };
        session = await stripe.checkout.sessions.create(
          {
            customer,
            mode: "subscription",
            payment_method_types: ["card"],
            line_items: [{ price: attempt.stripe_price_id, quantity: 1 }],
            expires_at: Math.floor(attempt.expires_at / 1000),
            metadata,
            subscription_data: { metadata },
            success_url: `${siteUrl()}/dashboard/members/checkout/success?attempt=${attempt._id}`,
            cancel_url: `${siteUrl()}/dashboard/members`,
          },
          { idempotencyKey: `monthly-checkout:${attempt._id}` },
        );
      }
      await ctx.runMutation(internal.billingStore.saveSession, {
        id: attempt._id,
        session_id: session.id,
        customer_id: customer,
        expires_at: session.expires_at * 1000,
      });
      if (session.status !== "open" || !session.url)
        throw new Error("Checkout is no longer open");
      return { url: session.url, attempt_id: attempt._id };
    } catch (error) {
      // A network timeout can leave a real Stripe Session. Retain the reservation until reconciled.
      await ctx.runMutation(internal.billingStore.recordAttemptError, {
        id: attempt._id,
        error: "Checkout requires retry or reconciliation",
      });
      throw error;
    }
  },
});

function siteUrl() {
  const value = process.env.SITE_URL;
  if (!value) throw new Error("SITE_URL is required");
  return value.replace(/\/$/, "");
}

// Returning to the dashboard abandons checkout, including older saved sessions.
export const abandonMonthlyCheckouts = action({
  args: {},
  handler: async (ctx): Promise<void> => {
    const payer = await ctx.runQuery(internal.billingStore.payer, {});
    const attempts = await ctx.runQuery(
      internal.billingStore.memberPendingAttempts,
      {},
    );
    if (!attempts.length) return;
    const stripe = stripeClient();
    for (const attempt of attempts) {
      let sessionId = attempt.stripe_session_id;
      if (!sessionId && payer.stripe_id) {
        // Recover a session created before a timeout prevented saveSession.
        for await (const session of stripe.checkout.sessions.list({
          customer: payer.stripe_id,
          limit: 100,
        })) {
          if (session.metadata?.monthly_attempt_id === attempt._id) {
            sessionId = session.id;
            break;
          }
        }
      }
      if (!sessionId) {
        await ctx.runMutation(internal.billingStore.expireAttempt, {
          id: attempt._id,
        });
        continue;
      }
      let session = await stripe.checkout.sessions.retrieve(sessionId);
      if (
        session.metadata?.monthly_attempt_id !== attempt._id ||
        stripeId(session.customer) !== payer.stripe_id ||
        session.mode !== "subscription"
      )
        throw new Error("Checkout ownership mismatch");
      if (session.status === "open") {
        try {
          session = await stripe.checkout.sessions.expire(session.id);
        } catch (error) {
          // Payment or another dashboard visit may win the expiration race.
          session = await stripe.checkout.sessions.retrieve(session.id);
          if (session.status === "open") throw error;
        }
      }
      if (session.status === "expired") {
        await ctx.runMutation(internal.billingStore.expireAttempt, {
          id: attempt._id,
          session_id: session.id,
        });
      } else if (session.status === "complete" && session.subscription) {
        await syncSubscription(
          ctx,
          stripe,
          stripeId(session.subscription)!,
          `dashboard:${attempt._id}:${Date.now()}`,
          "application.checkout_return",
        );
      } else throw new Error("Checkout could not be cleared");
    }
  },
});

export const scheduleCancellation = action({
  args: { subscription_id: v.id("subscription") },
  handler: async (ctx, args): Promise<{ success: true }> => {
    const row = await ctx.runQuery(
      internal.billingStore.authorizedSubscription,
      { id: args.subscription_id },
    );
    const stripe = stripeClient();
    await stripe.subscriptions.update(row.stripe_subscription_id, {
      cancel_at: null,
      cancel_at_period_end: true,
      metadata: { cancellation_reason: "member" },
    });
    await syncSubscription(
      ctx,
      stripe,
      row.stripe_subscription_id,
      `cancel:${row._id}:${Date.now()}`,
      "application.cancel",
    );
    return { success: true };
  },
});

export const undoCancellation = action({
  args: { subscription_id: v.id("subscription") },
  handler: async (ctx, args): Promise<{ success: true }> => {
    const row = await ctx.runQuery(
      internal.billingStore.authorizedSubscription,
      { id: args.subscription_id },
    );
    if (["canceled", "incomplete_expired"].includes(row.status))
      throw new Error("Subscription has ended");
    const enrollment = await ctx.runQuery(internal.billingStore.enrollment, {
      student_id: row.student_id,
    });
    if (
      !enrollment.student ||
      enrollment.student.status !== "active" ||
      (enrollment.student.expiry_date ?? 0) <= Date.now()
    )
      throw new Error("Renew Raz-Japan before resuming the add-on");
    const stripe = stripeClient();
    await stripe.subscriptions.update(row.stripe_subscription_id, {
      metadata: { cancellation_reason: "annual_expiry" },
      cancel_at_period_end: false,
    });
    await syncSubscription(
      ctx,
      stripe,
      row.stripe_subscription_id,
      `resume:${row._id}:${Date.now()}`,
      "application.resume",
    );
    return { success: true };
  },
});

export const createBillingPortal = action({
  args: {},
  handler: async (ctx): Promise<{ url: string }> => {
    const payer = await ctx.runQuery(internal.billingStore.payer, {});
    if (!payer.stripe_id) throw new Error("No billing customer");
    const configuration = process.env.STRIPE_BILLING_PORTAL_CONFIGURATION_ID;
    if (!configuration) throw new Error("Billing portal is not configured");
    const stripe = stripeClient();
    const portal =
      await stripe.billingPortal.configurations.retrieve(configuration);
    if (
      !portal.active ||
      !portal.features.payment_method_update.enabled ||
      !portal.features.invoice_history.enabled ||
      !portal.features.subscription_cancel.enabled ||
      portal.features.subscription_cancel.mode !== "at_period_end" ||
      portal.features.subscription_update.enabled
    )
      throw new Error("Unsupported billing portal configuration");
    const session = await stripe.billingPortal.sessions.create({
      customer: payer.stripe_id,
      configuration,
      return_url: `${siteUrl()}/dashboard/members`,
    });
    return { url: session.url };
  },
});

export const resolvePayment = action({
  args: { subscription_id: v.id("subscription") },
  handler: async (ctx, args): Promise<{ url: string }> => {
    const payer = await ctx.runQuery(internal.billingStore.payer, {});
    const row = await ctx.runQuery(
      internal.billingStore.authorizedSubscription,
      { id: args.subscription_id },
    );
    if (row.user_id !== payer._id)
      throw new Error("Only the payer can open a payment page");
    const invoices = await stripeClient().invoices.list({
      subscription: row.stripe_subscription_id,
      status: "open",
      limit: 10,
    });
    const invoice = invoices.data.find((i) => i.hosted_invoice_url);
    if (
      !invoice ||
      stripeId(invoice.customer) !== row.stripe_customer_id ||
      stripeId(invoice.parent?.subscription_details?.subscription) !==
        row.stripe_subscription_id
    )
      throw new Error("No payable invoice for this subscription");
    return { url: invoice.hosted_invoice_url! };
  },
});

function stripeId(value: string | { id: string } | null | undefined) {
  return typeof value === "string" ? value : value?.id;
}

async function syncSubscription(
  ctx: ActionCtx,
  stripe: Stripe,
  id: string,
  eventId: string,
  eventType: string,
  invoice?: Stripe.Invoice,
) {
  const observedAt = Date.now();
  let subscription = await stripe.subscriptions.retrieve(id);
  const attemptId = subscription.metadata.monthly_attempt_id;
  // Other products in this Stripe account must not affect RAZ records.
  if (!attemptId) return;
  const [item] = subscription.items.data;
  if (
    !item ||
    subscription.items.data.length !== 1 ||
    item.quantity !== 1 ||
    item.price.currency !== "jpy" ||
    item.price.recurring?.interval !== "month" ||
    item.price.recurring.interval_count !== 1
  )
    throw new Error("Unsupported monthly subscription shape");
  const attempt = await ctx.runQuery(internal.billingStore.attempt, {
    id: attemptId as Id<"monthly_checkout">,
  });
  if (!attempt) throw new Error("Monthly checkout mapping missing");
  const enrollment = await ctx.runQuery(internal.billingStore.enrollment, {
    student_id: attempt.student_id,
  });
  const student = enrollment.student;
  if (
    !student ||
    student.user_id !== attempt.user_id ||
    enrollment.course?._id !==
      (
        await ctx.runQuery(internal.queries.course.getCourseInternal, {
          id: attempt.course_id,
        })
      )?.parent_course_id
  )
    throw new Error("Add-on enrollment mapping changed");
  let cancellationReason: "member" | "annual_expiry" | undefined;
  let stopAt: number | undefined;
  if (!["canceled", "incomplete_expired"].includes(subscription.status)) {
    // Portal cancellation is a member decision too. Annual cancellation uses a fixed full-period boundary.
    const memberCancel = subscription.cancel_at_period_end;
    cancellationReason = memberCancel ? "member" : "annual_expiry";
    if (!memberCancel) {
      const expiry =
        student.status === "removed"
          ? Date.now()
          : (student.expiry_date ?? Date.now());
      stopAt = renewalStopAt(
        subscription.billing_cycle_anchor,
        item.current_period_end,
        expiry,
      );
      if (subscription.cancel_at !== Math.floor(stopAt / 1000)) {
        subscription = await stripe.subscriptions.update(id, {
          cancel_at: Math.floor(stopAt / 1000),
          proration_behavior: "none",
          metadata: { cancellation_reason: "annual_expiry" },
        });
      }
    }
  } else
    cancellationReason =
      subscription.metadata.cancellation_reason === "annual_expiry"
        ? "annual_expiry"
        : "member";

  let invoiceData;
  if (invoice) {
    if (!invoice.id) throw new Error("Invoice ID missing");
    const current = await stripe.invoices.retrieve(invoice.id);
    if (!current.id) throw new Error("Invoice ID missing");
    if (
      stripeId(current.parent?.subscription_details?.subscription) !==
        subscription.id ||
      stripeId(current.customer) !== stripeId(subscription.customer)
    )
      throw new Error("Invoice ownership mismatch");
    const lines = await stripe.invoices.listLineItems(current.id, {
      limit: 100,
    });
    const line = lines.data.find(
      (l) =>
        l.parent?.subscription_item_details?.subscription_item === item.id &&
        !l.parent.subscription_item_details.proration,
    );
    if (
      !line ||
      lines.has_more ||
      lines.data.length !== 1 ||
      line.pricing?.price_details?.price !== attempt.stripe_price_id
    )
      throw new Error("Unsupported invoice lines");
    invoiceData = {
      id: current.id,
      amount: current.amount_paid,
      currency: current.currency,
      period_start: line.period.start * 1000,
      period_end: line.period.end * 1000,
      paid: current.status === "paid",
      failed:
        current.status === "open" &&
        (eventType === "invoice.payment_failed" ||
          eventType === "invoice.payment_action_required" ||
          current.attempt_count > 0),
    };
  }
  await ctx.runMutation(internal.billingStore.applySubscription, {
    snapshot: {
      attempt_id: attempt._id,
      stripe_subscription_id: subscription.id,
      stripe_customer_id: stripeId(subscription.customer)!,
      stripe_item_id: item.id,
      stripe_price_id: item.price.id,
      status: subscription.status,
      period_start: item.current_period_start * 1000,
      period_end: item.current_period_end * 1000,
      cancel_at_period_end: subscription.cancel_at_period_end,
      cancel_at: subscription.cancel_at
        ? subscription.cancel_at * 1000
        : undefined,
      canceled_at: subscription.canceled_at
        ? subscription.canceled_at * 1000
        : undefined,
      annual_expires_at: student.expiry_date,
      renewal_stop_at: stopAt,
      cancellation_reason: cancellationReason,
      ended_at: subscription.ended_at
        ? subscription.ended_at * 1000
        : undefined,
    },
    invoice: invoiceData,
    event_id: eventId,
    event_type: eventType,
    observed_at: observedAt,
  });
}

// Called only by the signature-verifying webhook action, never directly by a browser.
export const handleEvent = internalAction({
  args: { event_json: v.string() },
  handler: async (ctx, { event_json }) => {
    const event = JSON.parse(event_json) as Stripe.Event;
    const stripe = stripeClient();
    if (
      event.type === "checkout.session.completed" ||
      event.type === "checkout.session.expired"
    ) {
      const session = await stripe.checkout.sessions.retrieve(
        event.data.object.id,
      );
      const attemptId = session.metadata?.monthly_attempt_id;
      if (!attemptId || session.mode !== "subscription") return;
      if (session.status === "expired")
        await ctx.runMutation(internal.billingStore.expireAttempt, {
          id: attemptId as Id<"monthly_checkout">,
          session_id: session.id,
        });
      else if (session.subscription)
        await syncSubscription(
          ctx,
          stripe,
          stripeId(session.subscription)!,
          event.id,
          event.type,
        );
    } else if (
      event.type === "invoice.paid" ||
      event.type === "invoice.payment_failed" ||
      event.type === "invoice.payment_action_required"
    ) {
      if (!event.data.object.id) throw new Error("Invoice ID missing");
      const invoice = await stripe.invoices.retrieve(event.data.object.id);
      const id = stripeId(invoice.parent?.subscription_details?.subscription);
      if (id)
        await syncSubscription(ctx, stripe, id, event.id, event.type, invoice);
    } else if (
      event.type === "customer.subscription.created" ||
      event.type === "customer.subscription.updated" ||
      event.type === "customer.subscription.deleted"
    ) {
      await syncSubscription(
        ctx,
        stripe,
        event.data.object.id,
        event.id,
        event.type,
      );
    }
  },
});

export const reconcile = internalAction({
  args: {},
  handler: async (ctx) => {
    const stripe = stripeClient();
    const rows = await ctx.runQuery(
      internal.billingStore.dueReconciliation,
      {},
    );
    for (const row of rows) {
      try {
        const recordedInvoices = new Set(
          await ctx.runQuery(internal.billingStore.paidInvoiceIds, {
            subscription_id: row._id,
          }),
        );
        // Iterate all invoices to recover payments missed during an extended webhook outage.
        for await (const invoice of stripe.invoices.list({
          subscription: row.stripe_subscription_id,
          limit: 100,
        })) {
          if (
            (invoice.status === "paid" &&
              invoice.id &&
              !recordedInvoices.has(invoice.id)) ||
            invoice.status === "open"
          )
            await syncSubscription(
              ctx,
              stripe,
              row.stripe_subscription_id,
              `reconcile:${invoice.id}:${invoice.status}:${invoice.attempt_count}`,
              "reconciliation.invoice",
              invoice,
            );
        }
        await syncSubscription(
          ctx,
          stripe,
          row.stripe_subscription_id,
          `reconcile:${row._id}:${Date.now()}`,
          "reconciliation.subscription",
        );
      } catch {
        await ctx.runMutation(internal.billingStore.reconciliationError, {
          id: row._id,
          error: "Stripe subscription reconciliation failed",
        });
      }
    }
    const attempts = await ctx.runQuery(
      internal.billingStore.pendingAttempts,
      {},
    );
    for (const attempt of attempts) {
      try {
        let sessionId = attempt.stripe_session_id;
        if (!sessionId) {
          // Search Customer sessions: a Stripe request may have succeeded before the local save failed.
          const payer = await ctx.runQuery(
            internal.queries.users.getUserByIdInternal,
            { id: attempt.user_id },
          );
          if (!payer?.stripe_id) {
            await ctx.runMutation(internal.billingStore.expireAttempt, {
              id: attempt._id,
            });
            continue;
          }
          for await (const session of stripe.checkout.sessions.list({
            customer: payer.stripe_id,
            limit: 100,
          })) {
            if (session.metadata?.monthly_attempt_id === attempt._id) {
              sessionId = session.id;
              break;
            }
          }
        }
        if (!sessionId) {
          // More than 24h old, and a complete Stripe listing confirms no session exists.
          await ctx.runMutation(internal.billingStore.expireAttempt, {
            id: attempt._id,
          });
          continue;
        }
        const session = await stripe.checkout.sessions.retrieve(sessionId);
        if (session.status === "expired")
          await ctx.runMutation(internal.billingStore.expireAttempt, {
            id: attempt._id,
            session_id: session.id,
          });
        else if (session.subscription)
          await syncSubscription(
            ctx,
            stripe,
            stripeId(session.subscription)!,
            `attempt:${attempt._id}:${Date.now()}`,
            "reconciliation.checkout",
          );
      } catch {
        await ctx.runMutation(internal.billingStore.recordAttemptError, {
          id: attempt._id,
          error: "Checkout reconciliation failed; reservation retained",
        });
      }
    }
    const annualOrders = await ctx.runQuery(
      internal.annualBilling.pendingOrders,
      {},
    );
    for (const order of annualOrders) {
      // Leave legacy orders without snapshots for administrative review.
      if (!order.purchase_snapshot) continue;
      try {
        let sessionId = order.stripe_order_id;
        if (!sessionId) {
          const payer = await ctx.runQuery(
            internal.queries.users.getUserByIdInternal,
            { id: order.user_id },
          );
          if (payer?.stripe_id)
            for await (const session of stripe.checkout.sessions.list({
              customer: payer.stripe_id,
              limit: 100,
            })) {
              if (session.metadata?.order_id === order._id) {
                sessionId = session.id;
                break;
              }
            }
        }
        if (!sessionId) {
          await ctx.runMutation(internal.annualBilling.expireOrder, {
            order_id: order._id,
            session_id: "",
          });
          continue;
        }
        const session = await stripe.checkout.sessions.retrieve(sessionId);
        if (session.status === "expired")
          await ctx.runMutation(internal.annualBilling.expireOrder, {
            order_id: order._id,
            session_id: session.id,
          });
        else if (
          session.mode === "payment" &&
          session.payment_status === "paid" &&
          session.currency === "jpy" &&
          session.amount_total !== null
        )
          await ctx.runMutation(internal.annualBilling.fulfillOrder, {
            order_id: order._id,
            session_id: session.id,
            customer_id: stripeId(session.customer)!,
            amount: session.amount_total,
          });
      } catch {
        // Keep the reservation: uncertain Stripe state must never free potentially paid inventory.
        continue;
      }
    }
  },
});

export const syncStudent = internalAction({
  args: { student_id: v.id("student") },
  handler: async (ctx, args) => {
    const rows = await ctx.runQuery(
      internal.billingStore.studentSubscriptions,
      args,
    );
    if (!rows.length) return;
    const stripe = stripeClient();
    for (const row of rows) {
      try {
        await syncSubscription(
          ctx,
          stripe,
          row.stripe_subscription_id,
          `enrollment:${row._id}:${Date.now()}`,
          "enrollment.updated",
        );
      } catch {
        await ctx.runMutation(internal.billingStore.reconciliationError, {
          id: row._id,
          error: "Annual enrollment billing synchronization failed",
        });
      }
    }
  },
});
