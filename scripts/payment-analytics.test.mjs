import assert from "node:assert/strict";
import { test } from "node:test";
import { fixture, loadBilling } from "./billing-test-helpers.mjs";

const attribution = {
  project_token: "phc_qa",
  distinct_id: "7c106fe5-8a16-4973-886a-75c779d62309",
  locale: "ja",
  utm_source: "google",
  utm_campaign: "private@example.test",
};
const env = {
  POSTHOG_PAYMENT_PROJECT_TOKEN: "phc_qa",
  POSTHOG_PAYMENT_HOST: "https://us.i.posthog.com",
};

function setup(options) {
  const db = fixture();
  const runtime = loadBilling({ env, ...options });
  const ctx = runtime.context(db);
  const jobs = [];
  ctx.scheduler.runAfter = async (delay, action, args) => {
    if (action.__path === "internal.stripe.sendPaymentConfirmed") {
      jobs.push({ delay, args });
    }
  };
  return {
    db,
    ctx,
    jobs,
    annual: runtime.load("annualBilling"),
    monthly: runtime.load("billingStore"),
    stripe: runtime.load("stripe"),
  };
}

const prepareAnnual = (db, ctx, annual, analytics) =>
  db.transaction(() =>
    annual.prepareCheckout.handler(ctx, {
      cart_id: "cart",
      new_price_id: "price_year",
      prices: [{ price_id: "price_year", amount: 4500 }],
      analytics,
    }),
  );

test("annual fulfillment schedules one payment event for a verified checkout despite duplicate deliveries", async () => {
  const { db, ctx, annual, jobs } = setup();
  db.add("cart", "cart", {
    user_id: "user",
    new_students: 1,
    renewal_students: [],
  });
  const order = await prepareAnnual(db, ctx, annual, attribution);
  const payment = {
    order_id: order._id,
    session_id: "cs_sandbox",
    customer_id: "cus_test",
    amount: 4500,
  };
  await assert.rejects(
    db.transaction(() =>
      annual.fulfillOrder.handler(ctx, { ...payment, amount: 1 }),
    ),
    /Annual payment mismatch/,
  );
  assert.equal(jobs.length, 0);
  await Promise.all([
    db.transaction(() => annual.fulfillOrder.handler(ctx, payment)),
    db.transaction(() => annual.fulfillOrder.handler(ctx, payment)),
  ]);
  assert.equal(jobs.length, 1);
  assert.equal(jobs[0].args.checkout_type, "annual");
  assert.equal(jobs[0].args.annual_order_type, "new");
  assert.equal(jobs[0].args.attribution.distinct_id, attribution.distinct_id);
  assert.equal(jobs[0].args.attribution.utm_campaign, undefined);
  assert.equal(db.table("payment_analytics_context").length, 0);
});

test("declined consent or a different project leaves payments functional and sends no event", async () => {
  for (const nextAttribution of [
    undefined,
    { ...attribution, project_token: "phc_production" },
  ]) {
    const { db, ctx, annual, jobs } = setup();
    db.add("cart", "cart", {
      user_id: "user",
      new_students: 1,
      renewal_students: [],
    });
    const order = await prepareAnnual(db, ctx, annual, attribution);
    await prepareAnnual(db, ctx, annual, nextAttribution);
    await db.transaction(() =>
      annual.fulfillOrder.handler(ctx, {
        order_id: order._id,
        session_id: "cs_sandbox",
        customer_id: "cus_test",
        amount: 4500,
      }),
    );
    assert.equal(jobs.length, 0);
    assert.equal((await db.get(order._id)).status, "fulfilled");
  }
});

test("monthly batch emits once for the initial charge, even when it includes multiple students", async () => {
  const { db, ctx, monthly, jobs } = setup();
  const expiry = Date.now() + 30 * 86400000;
  await db.patch("monthly", { parent_course_id: "annual" });
  await db.patch("annualstudent", {
    status: "active",
    user_id: "user",
    expiry_date: expiry,
  });
  db.add("student", "second", {
    course_id: "annual",
    status: "active",
    user_id: "user",
    expiry_date: expiry,
  });
  const batch = await db.transaction(() =>
    monthly.reserveBatch.handler(ctx, {
      selections: ["annualstudent", "second"].map((student_id) => ({
        student_id,
        course_id: "monthly",
      })),
      analytics: attribution,
    }),
  );
  await monthly.saveBatchSession.handler(ctx, {
    id: batch._id,
    session_id: "cs_month",
    customer_id: "cus_test",
  });
  const paid_at = Date.now();
  const payment = {
    id: batch._id,
    session_id: "cs_month",
    customer_id: "cus_test",
    amount: 1000,
    payment_intent_id: "pi_month",
    payment_method_id: "pm_test",
    paid_at,
    paid_through: paid_at + 86400000,
  };
  await db.transaction(() => monthly.recordBatchPayment.handler(ctx, payment));
  await db.transaction(() => monthly.recordBatchPayment.handler(ctx, payment));
  assert.equal(jobs.length, 1);
  assert.equal(jobs[0].args.checkout_type, "monthly");
  assert.equal(jobs[0].args.paid_at, paid_at);
  assert.equal(db.table("student_order").length, 2);
  assert.equal(db.table("payment_analytics_context").length, 0);
});

test("PostHog delivery retries the same event with a stable ID and a minimal payload", async () => {
  const requests = [];
  const { ctx, jobs, stripe } = setup({
    fetch: async (url, options) => {
      requests.push({ url, payload: JSON.parse(options.body) });
      return {
        status: requests.length === 1 ? 503 : 200,
        ok: requests.length > 1,
      };
    },
  });
  await stripe.sendPaymentConfirmed.handler(ctx, {
    order_id: "private_order",
    checkout_type: "monthly",
    paid_at: Date.UTC(2026, 10, 17),
    attribution,
    attempt: 0,
  });
  assert.equal(jobs.length, 1);
  assert.equal(jobs[0].delay, 60_000);
  await stripe.sendPaymentConfirmed.handler(ctx, jobs[0].args);
  assert.deepEqual(requests[0], requests[1]);
  assert.equal(requests[0].url, "https://us.i.posthog.com/i/v0/e/");
  assert.match(requests[0].payload.uuid, /^[a-f0-9-]{36}$/);
  assert.equal(requests[0].payload.event, "payment_confirmed");
  assert.deepEqual(requests[0].payload.properties, {
    distinct_id: attribution.distinct_id,
    locale: "ja",
    utm_source: "google",
    checkout_type: "monthly",
    $geoip_disable: true,
    $process_person_profile: false,
  });
  assert.ok(!JSON.stringify(requests).includes("private_order"));
});
