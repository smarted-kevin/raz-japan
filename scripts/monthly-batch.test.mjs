import assert from "node:assert/strict";
import { test } from "node:test";
import { fixture, loadBilling } from "./billing-test-helpers.mjs";

const day = 86_400_000;
const selections = [
  { student_id: "annualstudent", course_id: "monthly" },
  { student_id: "monthlystudent", course_id: "second" },
];

function setup() {
  const db = fixture();
  for (const id of ["annualstudent", "monthlystudent"])
    Object.assign(db.rows.get(id), {
      classroom_id: "annualroom",
      user_id: "user",
      status: "active",
      expiry_date: Date.now() + 365 * day,
    });
  db.rows.get("monthly").parent_course_id = "annual";
  db.add("course", "second", {
    ...db.rows.get("monthly"),
    _id: "second",
    price: 800,
    course_name: "Second",
    stripe_price_id: "price_second",
  });
  const sessions = new Map();
  const subscriptions = new Map();
  const calls = [];
  const paidAt = Math.floor(Date.now() / 1000) * 1000;
  const iterator = (rows) => ({
    async *[Symbol.asyncIterator]() {
      yield* rows;
    },
  });
  const stripe = {
    sessions,
    calls,
    failStudent: undefined,
    prices: {
      retrieve: async (id) => ({
        id,
        product: "prod_month",
        active: true,
        currency: "jpy",
        unit_amount: id === "price_second" ? 800 : 500,
        recurring: { interval: "month", interval_count: 1 },
      }),
    },
    checkout: {
      sessions: {
        list: () => iterator(sessions.values()),
        create: async (args, options) => {
          calls.push(["checkout", args, options]);
          const session = {
            ...args,
            id: `cs_${sessions.size}`,
            status: "open",
            url: "https://checkout.stripe.test/batch",
          };
          sessions.set(session.id, session);
          return session;
        },
        retrieve: async (id) => sessions.get(id),
        expire: async (id) => {
          const s = sessions.get(id);
          s.status = "expired";
          return s;
        },
      },
    },
    paymentIntents: {
      retrieve: async () => {
        const s = [...sessions.values()][0];
        return {
          id: "pi_batch",
          status: "succeeded",
          amount_received: s.amount_total,
          currency: "jpy",
          customer: s.customer,
          payment_method: "pm_batch",
          latest_charge: "ch_batch",
          metadata: s.payment_intent_data.metadata,
        };
      },
    },
    charges: { retrieve: async () => ({ created: paidAt / 1000 }) },
    subscriptions: {
      list: () => iterator(subscriptions.values()),
      create: async (args, options) => {
        if (args.items[0].price === stripe.failStudent)
          throw new Error("Stripe outage");
        const found = [...subscriptions.values()].find(
          (s) =>
            s.metadata.monthly_attempt_id === args.metadata.monthly_attempt_id,
        );
        if (found) return found;
        calls.push(["subscription", args, options]);
        const date = new Date(paidAt);
        const end = Date.UTC(
          date.getUTCFullYear(),
          date.getUTCMonth() + 1,
          Math.min(
            date.getUTCDate(),
            new Date(
              Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 2, 0),
            ).getUTCDate(),
          ),
          date.getUTCHours(),
          date.getUTCMinutes(),
          date.getUTCSeconds(),
        );
        const s = {
          ...args,
          id: `sub_${subscriptions.size}`,
          status: "active",
          billing_cycle_anchor: end / 1000,
          cancel_at_period_end: false,
          items: {
            data: [
              {
                id: `si_${subscriptions.size}`,
                quantity: 1,
                price: await stripe.prices.retrieve(args.items[0].price),
                current_period_start: paidAt / 1000,
                current_period_end: end / 1000,
              },
            ],
          },
        };
        subscriptions.set(s.id, s);
        return s;
      },
      retrieve: async (id) => subscriptions.get(id),
      update: async (id, args) => {
        const s = subscriptions.get(id);
        const metadata = { ...s.metadata, ...args.metadata };
        Object.assign(s, args, { metadata });
        return s;
      },
    },
    invoices: { list: () => iterator([]) },
    webhooks: { constructEventAsync: async (payload) => JSON.parse(payload) },
  };
  const runtime = loadBilling({
    stripe,
    env: { STRIPE_WEBHOOK_SECRET: "whsec_fake" },
  });
  const store = runtime.load("billingStore");
  const actions = runtime.load("subscriptions");
  const ctx = runtime.context(db);
  const start = (chosen = selections) =>
    actions.createMonthlyBatchCheckout.handler(ctx, { selections: chosen });
  const event = () => ({
    id: "evt_batch",
    type: "checkout.session.completed",
    data: { object: [...sessions.values()][0] },
  });
  const pay = async () => {
    const s = [...sessions.values()][0];
    Object.assign(s, {
      status: "complete",
      payment_status: "paid",
      currency: "jpy",
      amount_total: s.line_items.reduce(
        (sum, l) => sum + l.price_data.unit_amount,
        0,
      ),
      payment_intent: "pi_batch",
    });
    await actions.handleEvent.handler(ctx, {
      event_json: JSON.stringify(event()),
    });
  };
  return {
    db,
    stripe,
    runtime,
    store,
    actions,
    ctx,
    start,
    pay,
    event,
    paidAt,
  };
}

test("batch reservations are atomic, reusable, and exclude legacy and overlapping checkouts", async () => {
  const { db, store, ctx } = setup();
  const reserve = (s) =>
    db.transaction(() => store.reserveBatch.handler(ctx, { selections: s }));
  await assert.rejects(
    reserve([...selections, { student_id: "foreign", course_id: "monthly" }]),
    /enrollment/,
  );
  assert.equal(db.table("monthly_checkout").length, 0);
  await assert.rejects(reserve([]), /selection/);
  await assert.rejects(reserve([selections[0], selections[0]]), /selection/);
  const results = await Promise.all([
    reserve(selections),
    reserve([...selections].reverse()),
  ]);
  assert.equal(results[0]._id, results[1]._id);
  assert.equal(db.table("monthly_checkout").length, 2);
  await assert.rejects(reserve([selections[0]]), /pending/);
  await assert.rejects(
    store.reserve.handler(ctx, selections[0]),
    /batch checkout/,
  );
  const legacy = setup();
  await legacy.db.transaction(() =>
    legacy.store.reserve.handler(legacy.ctx, selections[0]),
  );
  await assert.rejects(
    legacy.db.transaction(() =>
      legacy.store.reserveBatch.handler(legacy.ctx, { selections }),
    ),
    /pending/,
  );
});

test("eligibility rejects foreign, expired, near-expiry, incompatible, unavailable and disabled selections", async () => {
  for (const change of [
    (db) => {
      db.rows.get("annualstudent").user_id = "other";
    },
    (db) => {
      db.rows.get("annualstudent").expiry_date = Date.now() - 1;
    },
    (db) => {
      db.rows.get("annualstudent").expiry_date = Date.now() + 30 * 60 * 1000;
    },
    (db) => {
      db.rows.get("monthly").parent_course_id = "wrong";
    },
    (db) => {
      db.rows.get("monthly").status = "inactive";
    },
    (db) => {
      db.rows.get("monthly").price = -1;
    },
  ]) {
    const { db, start } = setup();
    change(db);
    await assert.rejects(start());
    assert.equal(db.table("monthly_checkout_batch").length, 0);
    assert.equal(db.table("monthly_checkout").length, 0);
  }
  const { db } = setup();
  const runtime = loadBilling({
    env: { MONTHLY_SUBSCRIPTIONS_ENABLED: "false" },
  });
  await assert.rejects(
    runtime
      .load("billingStore")
      .reserveBatch.handler(runtime.context(db), { selections }),
    /disabled/,
  );
});

test("single and mixed-product batches charge once and create independent subscriptions with prepaid access", async () => {
  for (const chosen of [[selections[0]], selections]) {
    const { db, stripe, start, pay, actions, ctx, event, store } = setup();
    const result = await start(chosen);
    assert.equal(
      (await start([...chosen].reverse())).batch_id,
      result.batch_id,
    );
    assert.equal(stripe.calls.filter((c) => c[0] === "checkout").length, 1);
    const checkout = stripe.calls[0][1];
    assert.equal(checkout.mode, "payment");
    assert.equal(
      checkout.payment_intent_data.setup_future_usage,
      "off_session",
    );
    await pay();
    await actions.handleEvent.handler(ctx, {
      event_json: JSON.stringify(event()),
    });
    assert.equal(db.table("full_order").length, 1);
    assert.equal(db.table("student_order").length, chosen.length);
    assert.equal(db.table("subscription").length, chosen.length);
    assert.equal(
      stripe.calls.filter((c) => c[0] === "subscription").length,
      chosen.length,
    );
    for (const row of db.table("subscription")) {
      assert.ok(row.paid_through > Date.now());
      assert.equal(row.platform_enabled, false);
      assert.equal(row.activation_required, true);
      assert.equal(
        db.table("student_order").find((s) => s.student_id === row.student_id)
          .subscription_id,
        row._id,
      );
    }
    for (const [, params] of stripe.calls.filter(
      (c) => c[0] === "subscription",
    )) {
      assert.equal(params.proration_behavior, "none");
      assert.equal(params.default_payment_method, "pm_batch");
    }
    await assert.rejects(
      store.batchStatus.handler(
        { ...ctx, user: db.rows.get("other") },
        { id: result.batch_id },
      ),
      /access denied/,
    );
    assert.equal(
      (await store.batchStatus.handler(ctx, { id: result.batch_id })).paid,
      true,
    );
    if (chosen.length === 2) {
      const rows = db.table("subscription");
      await actions.scheduleCancellation.handler(ctx, {
        subscription_id: rows[0]._id,
      });
      assert.equal((await db.get(rows[0]._id)).cancel_at_period_end, true);
      assert.equal((await db.get(rows[1]._id)).cancel_at_period_end, false);
      await db.patch(rows[1].student_id, { expiry_date: Date.now() + day });
      await actions.syncStudent.handler(ctx, {
        student_id: rows[1].student_id,
      });
      assert.equal(
        (await db.get(rows[1]._id)).renewal_stop_at,
        rows[1].paid_through,
      );
    }
  }
});

test("partial fulfillment and unsaved Stripe subscription recovery never duplicate payment, orders or subscriptions", async () => {
  const { db, stripe, start, pay, actions, ctx } = setup();
  await start();
  stripe.failStudent = "price_second";
  await assert.rejects(pay(), /retry/);
  assert.equal(db.table("subscription").length, 1);
  assert.equal(db.table("full_order").length, 1);
  stripe.failStudent = undefined;
  const batch = db.table("monthly_checkout_batch")[0];
  await db.patch(batch._id, { next_reconcile_at: 0 });
  await actions.reconcile.handler(ctx, {});
  assert.equal(db.table("subscription").length, 2);
  assert.equal(db.table("full_order").length, 1);
  assert.equal((await db.get(batch._id)).status, "completed");

  const recovered = setup();
  await recovered.start();
  const apply = recovered.store.applySubscription.handler;
  let fail = true;
  recovered.store.applySubscription.handler = (...args) => {
    if (fail) throw new Error("Database outage");
    return apply(...args);
  };
  await assert.rejects(recovered.pay(), /retry/);
  assert.equal(recovered.db.table("subscription").length, 0);
  fail = false;
  await recovered.db.patch(
    recovered.db.table("monthly_checkout_batch")[0]._id,
    { next_reconcile_at: 0 },
  );
  await recovered.actions.reconcile.handler(recovered.ctx, {});
  assert.equal(recovered.db.table("subscription").length, 2);
  assert.equal(
    recovered.stripe.calls.filter((c) => c[0] === "subscription").length,
    2,
  );
});

test("cancel expires all reservations; payment winning the expiration race is fulfilled", async () => {
  const canceled = setup();
  const result = await canceled.start();
  await assert.rejects(
    canceled.actions.abandonMonthlyBatch.handler(
      canceled.runtime.context(canceled.db, "other"),
      { id: result.batch_id },
    ),
    /access denied/,
  );
  await canceled.actions.abandonMonthlyBatch.handler(canceled.ctx, {
    id: result.batch_id,
  });
  assert.ok(
    canceled.db.table("monthly_checkout").every((a) => a.status === "expired"),
  );
  const expiredEvent = {
    id: "evt_expired",
    type: "checkout.session.expired",
    data: { object: [...canceled.stripe.sessions.values()][0] },
  };
  await canceled.actions.handleEvent.handler(canceled.ctx, {
    event_json: JSON.stringify(expiredEvent),
  });
  await canceled.start();

  const race = setup();
  const paid = await race.start();
  race.stripe.checkout.sessions.expire = async (id) => {
    const s = race.stripe.sessions.get(id);
    Object.assign(s, {
      status: "complete",
      payment_status: "paid",
      currency: "jpy",
      amount_total: 1300,
      payment_intent: "pi_batch",
    });
    throw new Error("Payment won");
  };
  await race.actions.abandonMonthlyBatch.handler(race.ctx, {
    id: paid.batch_id,
  });
  assert.equal(race.db.table("subscription").length, 2);
  assert.equal((await race.db.get(paid.batch_id)).status, "completed");
});

test("batch payment verification and order writes are atomic", async () => {
  const { db, start, pay, stripe } = setup();
  await start();
  const original = stripe.paymentIntents.retrieve;
  stripe.paymentIntents.retrieve = async () => ({
    ...(await original()),
    customer: "cus_foreign",
  });
  await assert.rejects(pay(), /payment intent/);
  assert.equal(db.table("full_order").length, 0);
  stripe.paymentIntents.retrieve = original;
  const insert = db.insert.bind(db);
  db.insert = async (table, row) => {
    if (table === "student_order") throw new Error("Database outage");
    return insert(table, row);
  };
  await assert.rejects(pay(), /outage/);
  assert.equal(db.table("full_order").length, 0);
  db.insert = insert;
  await pay();
  assert.equal(db.table("full_order").length, 1);
});

test("paid batches past their prepaid deadline need administrative resolution, without a late new charge", async () => {
  const { db, stripe, start, pay, actions, ctx } = setup();
  await start();
  stripe.failStudent = "price_second";
  await assert.rejects(pay());
  stripe.failStudent = undefined;
  const b = db.table("monthly_checkout_batch")[0];
  await db.patch(b._id, { paid_through: Date.now() - 1, next_reconcile_at: 0 });
  await actions.reconcile.handler(ctx, {});
  assert.equal(stripe.calls.filter((c) => c[0] === "subscription").length, 1);
  assert.ok((await db.get(b._id)).error);
});

test("batch checkout payment-mode events reach monthly fulfillment rather than annual fulfillment", async () => {
  const { db, runtime, ctx, start, stripe, event } = setup();
  await start();
  const s = [...stripe.sessions.values()][0];
  Object.assign(s, {
    status: "complete",
    payment_status: "paid",
    currency: "jpy",
    amount_total: 1300,
    payment_intent: "pi_batch",
  });
  const result = await runtime.load("stripe").fulfill.handler(ctx, {
    payload: JSON.stringify(event()),
    signature: "sig_fake",
  });
  assert.equal(result.success, true);
  assert.equal(db.table("subscription").length, 2);
});

test("calendar months preserve leap-day, short-month and UTC clock boundaries", () => {
  const billing = loadBilling().load("lib/billing");
  assert.equal(
    billing.nextMonthlyBoundary(Date.UTC(2028, 0, 31, 12, 30)),
    Date.UTC(2028, 1, 29, 12, 30),
  );
  assert.equal(
    billing.nextMonthlyBoundary(Date.UTC(2027, 0, 31, 12, 30)),
    Date.UTC(2027, 1, 28, 12, 30),
  );
  assert.equal(
    billing.nextMonthlyBoundary(Date.UTC(2026, 11, 31, 23, 59, 59)),
    Date.UTC(2027, 0, 31, 23, 59, 59),
  );
});

test("renewal invoices extend only the paid student's access and record separate renewal orders once", async () => {
  const { db, stripe, start, pay, actions, ctx } = setup();
  await start();
  await pay();
  const rows = db.table("subscription");
  const row = rows[0];
  const subscription = await stripe.subscriptions.retrieve(
    row.stripe_subscription_id,
  );
  const item = subscription.items.data[0];
  const end = loadBilling()
    .load("lib/billing")
    .nextMonthlyBoundary(row.paid_through);
  item.current_period_start = row.paid_through / 1000;
  item.current_period_end = end / 1000;
  const invoice = {
    id: "in_renewal",
    customer: "cus_test",
    parent: { subscription_details: { subscription: subscription.id } },
    status: "paid",
    amount_paid: row.price,
    currency: "jpy",
    attempt_count: 1,
  };
  stripe.invoices.retrieve = async () => invoice;
  stripe.invoices.listLineItems = async () => ({
    has_more: false,
    data: [
      {
        parent: {
          subscription_item_details: {
            subscription_item: item.id,
            proration: false,
          },
        },
        pricing: { price_details: { price: row.stripe_price_id } },
        period: { start: row.paid_through / 1000, end: end / 1000 },
      },
    ],
  });
  const event = {
    id: "evt_renewal",
    type: "invoice.paid",
    data: { object: invoice },
  };
  await actions.handleEvent.handler(ctx, { event_json: JSON.stringify(event) });
  await actions.handleEvent.handler(ctx, { event_json: JSON.stringify(event) });
  assert.equal((await db.get(row._id)).paid_through, end);
  assert.equal((await db.get(rows[1]._id)).paid_through, rows[1].paid_through);
  assert.equal(db.table("full_order").length, 2);
  assert.equal(
    db.table("student_order").filter((s) => s.order_type === "renewal").length,
    1,
  );
});

test("checkout timeouts recover the original session and mismatched Stripe prices retain reservations", async () => {
  const { db, stripe, start } = setup();
  const create = stripe.checkout.sessions.create;
  let fail = true;
  stripe.checkout.sessions.create = async (...args) => {
    const session = await create(...args);
    if (fail) throw new Error("Network timeout");
    return session;
  };
  await assert.rejects(start(), /timeout/);
  assert.equal(db.table("monthly_checkout").length, 2);
  fail = false;
  await start();
  assert.equal(stripe.calls.filter((c) => c[0] === "checkout").length, 1);

  const mismatch = setup();
  const retrieve = mismatch.stripe.prices.retrieve;
  mismatch.stripe.prices.retrieve = async (id) => ({
    ...(await retrieve(id)),
    unit_amount: 1,
  });
  await assert.rejects(mismatch.start(), /price mismatch/);
  assert.ok(
    mismatch.db.table("monthly_checkout").every((a) => a.status === "reserved"),
  );
  assert.equal(mismatch.db.table("full_order").length, 0);
});

test("member eligibility and global billing attention include unresolved paid batches", async () => {
  const { db, store, ctx, stripe, start, pay, runtime } = setup();
  assert.ok(
    (await store.memberBilling.handler(ctx, {})).students.every(
      (s) => s.eligibility_reason === null,
    ),
  );
  await start();
  assert.ok(
    (await store.memberBilling.handler(ctx, {})).students.every(
      (s) => s.eligibility_reason === "pending_checkout",
    ),
  );
  stripe.failStudent = "price_second";
  await assert.rejects(pay());
  const billing = await store.memberBilling.handler(ctx, {});
  assert.equal(
    billing.students.find((s) => s._id === "annualstudent").eligibility_reason,
    "already_subscribed",
  );
  assert.ok(
    (
      await store.billingIssues.handler(runtime.context(db, "admin"), {})
    ).checkouts.some(
      (s) => s._id === db.table("monthly_checkout_batch")[0]._id,
    ),
  );
  await assert.rejects(store.billingIssues.handler(ctx, {}), /Global admin/);
});
