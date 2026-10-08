import assert from "node:assert/strict";
import { test } from "node:test";
import { fixture, loadBilling } from "./billing-test-helpers.mjs";

const day = 86_400_000;
function addonFixture() {
  const db = fixture();
  Object.assign(db.rows.get("monthlystudent"), {
    classroom_id: "annualroom",
    user_id: "user",
    status: "active",
    expiry_date: Date.now() + 365 * day,
  });
  db.rows.get("monthly").parent_course_id = "annual";
  return db;
}

async function reservedFixture(options) {
  const db = addonFixture();
  const runtime = loadBilling(options);
  const store = runtime.load("billingStore");
  const ctx = runtime.context(db);
  const attempt = await db.transaction(() =>
    store.reserve.handler(ctx, {
      course_id: "monthly",
      student_id: "monthlystudent",
    }),
  );
  const now = Date.now();
  const snapshot = {
    attempt_id: attempt._id,
    stripe_subscription_id: "sub_test",
    stripe_customer_id: "cus_test",
    stripe_item_id: "si_test",
    stripe_price_id: "price_month",
    status: "active",
    period_start: now - day,
    period_end: now + 29 * day,
    cancel_at_period_end: false,
  };
  const apply = (args) =>
    db.transaction(() =>
      store.applySubscription.handler(ctx, {
        snapshot,
        event_id: `evt:${db.next}`,
        event_type: "invoice.paid",
        observed_at: Date.now(),
        ...args,
      }),
    );
  return { db, runtime, store, ctx, attempt, snapshot, apply, now };
}

test("add-on checkout is reusable and rejects another payer's annual student", async () => {
  const { db, ctx, store, attempt } = await reservedFixture();
  assert.equal(attempt.student_id, "monthlystudent");
  assert.equal(
    (
      await store.reserve.handler(ctx, {
        course_id: "monthly",
        student_id: "monthlystudent",
      })
    )._id,
    attempt._id,
  );
  await assert.rejects(
    store.reserve.handler(loadBilling().context(db, "other"), {
      course_id: "monthly",
      student_id: "monthlystudent",
    }),
    /enrollment/,
  );
  await assert.rejects(
    store.reserve.handler(ctx, { course_id: "annual" }),
    /unavailable/,
  );
  await assert.rejects(
    loadBilling({ env: { MONTHLY_SUBSCRIPTIONS_ENABLED: "false" } })
      .load("billingStore")
      .reserve.handler(ctx, {
        course_id: "monthly",
        student_id: "monthlystudent",
      }),
    /disabled/,
  );
});

test("invoice before checkout activates once; duplicate events and invoices do not duplicate orders", async () => {
  const { db, apply, snapshot } = await reservedFixture();
  const invoice = {
    id: "in_first",
    amount: 500,
    currency: "jpy",
    period_start: snapshot.period_start,
    period_end: snapshot.period_end,
    paid: true,
    failed: false,
  };
  await apply({ invoice, event_id: "evt_paid" });
  await apply({ invoice, event_id: "evt_paid" });
  await apply({ invoice, event_id: "evt_other" });
  assert.equal(db.table("full_order").length, 1);
  assert.equal(db.table("student_order").length, 1);
  assert.equal((await db.get("monthlystudent")).status, "active");
  assert.equal(db.table("subscription")[0].paid_through, snapshot.period_end);
  assert.equal(
    db.table("student_order")[0].billing_model,
    "monthly_subscription",
  );
});

test("unpaid initial invoice grants no access; successful payment restores it", async () => {
  const { db, apply, snapshot } = await reservedFixture();
  const invoice = {
    id: "in_first",
    amount: 0,
    currency: "jpy",
    period_start: snapshot.period_start,
    period_end: snapshot.period_end,
    paid: false,
    failed: true,
  };
  await apply({ invoice, event_type: "invoice.payment_action_required" });
  assert.equal((await db.get("monthlystudent")).status, "active");
  assert.equal(db.table("subscription")[0].grace_deadline, undefined);
  assert.equal((await storeAccess(db)).has_access, false);
  await apply({
    invoice: { ...invoice, amount: 500, paid: true, failed: false },
  });
  assert.equal((await db.get("monthlystudent")).status, "active");
});

async function storeAccess(db) {
  const runtime = loadBilling();
  return runtime
    .load("billingStore")
    .getSubscription.handler(runtime.context(db), {
      id: db.table("subscription")[0]._id,
    });
}

test("add-on payments never overwrite annual dates and activation acknowledgments are audited and scoped", async () => {
  const f = await reservedFixture();
  const before = await f.db.get("monthlystudent");
  await f.apply({
    invoice: {
      id: "in_activation",
      amount: 500,
      currency: "jpy",
      period_start: f.snapshot.period_start,
      period_end: f.snapshot.period_end,
      paid: true,
      failed: false,
    },
  });
  const after = await f.db.get("monthlystudent");
  assert.equal(after.expiry_date, before.expiry_date);
  assert.equal(after.start_date, before.start_date);
  const row = f.db.table("subscription")[0];
  const args = { subscription_id: row._id, enabled: true };
  for (const caller of ["user", "other", "orgadmin"])
    await assert.rejects(
      f.store.acknowledgeActivation.handler(
        f.runtime.context(f.db, caller),
        args,
      ),
      /admin/,
    );
  await f.db.transaction(() =>
    f.store.acknowledgeActivation.handler(
      f.runtime.context(f.db, "admin"),
      args,
    ),
  );
  await f.db.transaction(() =>
    f.store.acknowledgeActivation.handler(
      f.runtime.context(f.db, "admin"),
      args,
    ),
  );
  assert.equal(f.db.table("subscription_activation").length, 1);
  assert.equal(
    f.db.table("subscription_activation")[0].administrator_id,
    "admin",
  );
  await assert.rejects(
    f.store.acknowledgeActivation.handler(f.runtime.context(f.db, "admin"), {
      ...args,
      enabled: false,
    }),
    /changed/,
  );
  await f.db.patch(row._id, {
    status: "canceled",
    paid_through: Date.now() - day,
    platform_enabled: true,
  });
  await assert.rejects(
    f.store.reserve.handler(f.ctx, {
      student_id: "monthlystudent",
      course_id: "monthly",
    }),
    /subscribed/,
  );
  await f.store.acknowledgeActivation.handler(
    f.runtime.context(f.db, "admin"),
    { ...args, enabled: false },
  );
  assert.equal(f.db.table("subscription_activation").length, 2);
  const attempt = await f.store.reserve.handler(f.ctx, {
    student_id: "monthlystudent",
    course_id: "monthly",
  });
  assert.notEqual(attempt._id, f.attempt._id);
});

test("one add-on slot covers all products, pending checkouts and paid canceled periods", async () => {
  const f = await reservedFixture();
  f.db.add("course", "other_addon", {
    ...(await f.db.get("monthly")),
    parent_course_id: "annual",
  });
  // Memory fixtures must use the new ID rather than the copied document identity.
  f.db.rows.get("other_addon")._id = "other_addon";
  await assert.rejects(
    f.store.reserve.handler(f.ctx, {
      student_id: "monthlystudent",
      course_id: "other_addon",
    }),
    /pending/,
  );
  await f.apply({
    invoice: {
      id: "in_one",
      amount: 500,
      currency: "jpy",
      period_start: f.snapshot.period_start,
      period_end: f.snapshot.period_end,
      paid: true,
      failed: false,
    },
  });
  const row = f.db.table("subscription")[0];
  await f.db.patch(row._id, { status: "canceled" });
  await assert.rejects(
    f.store.reserve.handler(f.ctx, {
      student_id: "monthlystudent",
      course_id: "other_addon",
    }),
    /subscribed/,
  );
  await f.db.patch("monthlystudent", { expiry_date: Date.now() - day });
  await assert.rejects(
    f.store.reserve.handler(f.ctx, {
      student_id: "monthlystudent",
      course_id: "monthly",
    }),
    /enrollment/,
  );
});

test("monthly boundary calculation preserves full months across leap days and annual expiry", () => {
  const { renewalStopAt, accessDeadline } = loadBilling().load("lib/billing");
  const anchor = Date.UTC(2024, 0, 31, 9) / 1000;
  const february = Date.UTC(2024, 1, 29, 9) / 1000;
  assert.equal(
    renewalStopAt(anchor, february, Date.UTC(2024, 2, 15)),
    Date.UTC(2024, 2, 31, 9),
  );
  assert.equal(
    renewalStopAt(anchor, february, february * 1000),
    february * 1000,
  );
  const paid = Date.UTC(2024, 2, 31, 9);
  assert.equal(
    accessDeadline({
      paid_through: paid,
      payment_failed: true,
      grace_deadline: paid + 7 * day,
      annual_expires_at: paid - 2 * day,
      cancellation_reason: "annual_expiry",
      cancel_at: paid,
      cancel_at_period_end: false,
      status: "active",
    }),
    paid,
  );
});

test("payment recovery only opens the payer's verified invoice, never an administrator's foreign portal", async () => {
  let customer = "cus_test";
  const stripe = {
    invoices: {
      list: async () => ({
        data: [
          {
            customer,
            parent: { subscription_details: { subscription: "sub_test" } },
            hosted_invoice_url: "https://invoice.stripe.com/test",
          },
        ],
      }),
    },
  };
  const f = await reservedFixture({ stripe });
  await f.apply({});
  const args = { subscription_id: f.db.table("subscription")[0]._id };
  const actions = f.runtime.load("subscriptions");
  assert.equal(
    (await actions.resolvePayment.handler(f.ctx, args)).url,
    "https://invoice.stripe.com/test",
  );
  for (const caller of ["other", "admin", "orgadmin"])
    await assert.rejects(
      actions.resolvePayment.handler(f.runtime.context(f.db, caller), args),
      /payer|denied/,
    );
  customer = "cus_wrong";
  await assert.rejects(
    actions.resolvePayment.handler(f.ctx, args),
    /payable invoice/,
  );
});

test("annual renewal alongside an add-on preserves member cancellation and schedules synchronization", async () => {
  const f = await reservedFixture();
  await f.apply({ snapshot: { ...f.snapshot, cancel_at_period_end: true } });
  const before = await f.db.get("monthlystudent");
  const scheduled = [];
  f.ctx.scheduler.runAfter = async (_delay, _ref, args) => scheduled.push(args);
  await f.runtime
    .load("mutations/student")
    .renewStudent.handler(f.ctx, { student_id: "monthlystudent" });
  const after = await f.db.get("monthlystudent");
  assert.ok(after.expiry_date > before.expiry_date + 364 * day);
  assert.equal(f.db.table("subscription")[0].cancel_at_period_end, true);
  assert.equal(scheduled[0].student_id, "monthlystudent");
});

test("admin subscription and checkout queries reject foreign payer records", async () => {
  const f = await reservedFixture();
  await f.apply({});
  const foreign = await f.store.adminSubscriptions.handler(
    f.runtime.context(f.db, "orgadmin"),
    {},
  );
  assert.equal(foreign.page.length, 1);
  assert.equal(foreign.page[0].can_activate, false);
  await f.db.patch("user", { org_id: "different-org" });
  assert.equal(
    (
      await f.store.adminSubscriptions.handler(
        f.runtime.context(f.db, "orgadmin"),
        {},
      )
    ).page.length,
    0,
  );
  await assert.rejects(
    f.store.checkoutStatus.handler(f.runtime.context(f.db, "other"), {
      attempt_id: f.attempt._id,
    }),
    /denied/,
  );
  await assert.rejects(
    f.store.adminSubscriptions.handler(f.runtime.context(f.db, "orgadmin"), {
      user_id: "user",
    }),
    /denied/,
  );
});

test("failed renewal gives seven-day grace, expires without recycling, and successful retry restores access", async () => {
  const { db, apply, snapshot, now, store, ctx } = await reservedFixture();
  const previous = {
    id: "in_old",
    amount: 500,
    currency: "jpy",
    period_start: now - 32 * day,
    period_end: now - 2 * day,
    paid: true,
    failed: false,
  };
  await apply({ invoice: previous });
  const renewal = {
    ...previous,
    id: "in_renew",
    period_start: previous.period_end,
    period_end: now + 28 * day,
    amount: 0,
    paid: false,
    failed: true,
  };
  await apply({ invoice: renewal, event_type: "invoice.payment_failed" });
  assert.equal(
    db.table("subscription")[0].grace_deadline,
    previous.period_end + 7 * day,
  );
  assert.equal((await db.get("monthlystudent")).status, "active");
  const row = db.table("subscription")[0];
  await db.patch(row._id, {
    paid_through: now - 9 * day,
    grace_deadline: now - 2 * day,
    access_deadline: now - 2 * day,
  });
  await store.expireAccess.handler(ctx, {});
  assert.equal((await db.get("monthlystudent")).status, "active");
  assert.equal((await db.get("monthlystudent")).user_id, "user");
  await apply({
    invoice: { ...renewal, amount: 500, paid: true, failed: false },
    snapshot: { ...snapshot, period_end: renewal.period_end },
  });
  assert.equal((await db.get("monthlystudent")).status, "active");
  assert.equal(db.table("subscription")[0].grace_deadline, undefined);
});

test("voluntary cancellation removes grace and old invoices cannot shorten paid access", async () => {
  const { db, apply, snapshot, now } = await reservedFixture();
  const invoice = {
    id: "in_new",
    amount: 500,
    currency: "jpy",
    period_start: now,
    period_end: now + 30 * day,
    paid: true,
    failed: false,
  };
  await apply({ invoice });
  await apply({
    invoice: { ...invoice, id: "in_older", period_end: now + day },
  });
  assert.equal(db.table("subscription")[0].paid_through, invoice.period_end);
  const row = db.table("subscription")[0];
  await db.patch(row._id, {
    payment_failed: true,
    grace_deadline: invoice.period_end + 7 * day,
  });
  await apply({ snapshot: { ...snapshot, cancel_at_period_end: true } });
  assert.equal(db.table("subscription")[0].access_deadline, invoice.period_end);
  await apply({ snapshot: { ...snapshot, cancel_at_period_end: false } });
  assert.equal(
    db.table("subscription")[0].access_deadline,
    invoice.period_end + 7 * day,
  );
});

test("foreign customers, wrong prices, and invalid invoices roll back all updates", async () => {
  const { db, apply, snapshot } = await reservedFixture();
  await assert.rejects(
    apply({ snapshot: { ...snapshot, stripe_customer_id: "cus_foreign" } }),
    /customer mismatch/,
  );
  await assert.rejects(
    apply({ snapshot: { ...snapshot, stripe_price_id: "price_other" } }),
    /mapping/,
  );
  await assert.rejects(
    apply({
      invoice: {
        id: "in_bad",
        amount: 500,
        currency: "usd",
        period_start: snapshot.period_start,
        period_end: snapshot.period_end,
        paid: true,
        failed: false,
      },
    }),
    /Invalid invoice/,
  );
  assert.equal(db.table("subscription").length, 0);
  assert.equal((await db.get("monthlystudent")).user_id, "user");
  assert.equal(db.table("stripe_webhook").length, 0);
});

test("members own their billing; organization admins only read their organization's subscriptions", async () => {
  const { db, apply, store, runtime } = await reservedFixture();
  await apply({});
  const id = db.table("subscription")[0]._id;
  await assert.rejects(
    store.getSubscription.handler(runtime.context(db, "other"), { id }),
    /denied/,
  );
  await assert.rejects(
    store.authorizedSubscription.handler(runtime.context(db, "orgadmin"), {
      id,
    }),
    /Billing control denied/,
  );
  assert.equal(
    (
      await store.getSubscription.handler(runtime.context(db, "orgadmin"), {
        id,
      })
    )._id,
    id,
  );
  for (const caller of ["user", "admin", "god"])
    assert.equal(
      (
        await store.authorizedSubscription.handler(
          runtime.context(db, caller),
          { id },
        )
      )._id,
      id,
    );
});

test("expired sessions release the checkout lock without changing enrollment", async () => {
  const { db, store, ctx, attempt, apply } = await reservedFixture();
  await store.saveSession.handler(ctx, {
    id: attempt._id,
    session_id: "cs_test",
    customer_id: "cus_test",
    expires_at: Date.now(),
  });
  await assert.rejects(
    store.expireAttempt.handler(ctx, {
      id: attempt._id,
      session_id: "cs_other",
    }),
    /mismatch/,
  );
  await apply({});
  await store.expireAttempt.handler(ctx, {
    id: attempt._id,
    session_id: "cs_test",
  });
  assert.equal((await db.get("monthlystudent")).checkout_attempt_id, undefined);
  const other = await reservedFixture();
  await other.store.expireAttempt.handler(other.ctx, { id: other.attempt._id });
  assert.equal(
    (await other.db.get("monthlystudent")).checkout_attempt_id,
    undefined,
  );
});

test("annual fulfillment is atomic, immutable after cart edits, and idempotent", async () => {
  const db = fixture();
  const runtime = loadBilling();
  const ctx = runtime.context(db);
  const annual = runtime.load("annualBilling");
  db.add("cart", "cart", { user_id: "user", new_students: 1 });
  const order = await db.transaction(() =>
    annual.prepareCheckout.handler(ctx, {
      cart_id: "cart",
      new_price_id: "price_year",
      prices: [{ price_id: "price_year", amount: 4500 }],
    }),
  );
  await db.patch("cart", { new_students: 99 });
  const args = {
    session_id: "cs_annual",
    order_id: order._id,
    customer_id: "cus_test",
    amount: 4500,
  };
  const originalInsert = db.insert.bind(db);
  let fail = true;
  db.insert = async (table, row) => {
    if (table === "student_order" && fail) throw new Error("simulated outage");
    return originalInsert(table, row);
  };
  await assert.rejects(
    db.transaction(() => annual.fulfillOrder.handler(ctx, args)),
    /outage/,
  );
  assert.equal((await db.get(order._id)).status, "created");
  assert.equal((await db.get("annualstudent")).user_id, undefined);
  fail = false;
  await db.transaction(() => annual.fulfillOrder.handler(ctx, args));
  await db.transaction(() => annual.fulfillOrder.handler(ctx, args));
  assert.equal(db.table("student_order").length, 1);
  assert.equal((await db.get(order._id)).status, "fulfilled");
  assert.equal((await db.get("annualstudent")).user_id, "user");
  assert.ok(
    (await db.get("annualstudent")).expiry_date > Date.now() + 364 * day,
  );
});

test("annual checkout rejects monthly renewals and foreign cart ownership", async () => {
  const db = fixture();
  const runtime = loadBilling();
  const annual = runtime.load("annualBilling");
  const ctx = runtime.context(db);
  await db.patch("monthlystudent", { user_id: "user" });
  db.add("cart", "cart", {
    user_id: "user",
    new_students: 0,
    renewal_students: ["monthlystudent"],
  });
  const args = {
    cart_id: "cart",
    new_price_id: "price_year",
    prices: [{ price_id: "price_month", amount: 500 }],
  };
  await assert.rejects(
    annual.prepareCheckout.handler(ctx, args),
    /Annual course unavailable/,
  );
  await assert.rejects(
    annual.prepareCheckout.handler(runtime.context(db, "other"), args),
    /access denied/,
  );
});

test("course backfill is resumable and does not change annual prices or student dates", async () => {
  const db = fixture();
  await db.patch("annual", { stripe_product_id: undefined });
  const runtime = loadBilling();
  const store = runtime.load("billingStore");
  await store.backfillCourses.handler(runtime.context(db), {});
  assert.equal((await db.get("annual")).billing_model, "annual_purchase");
  assert.equal((await db.get("annual")).price, 4500);
  assert.equal((await db.get("annual")).provisioning_state, "ready");
  assert.equal((await db.get("monthly")).billing_model, "monthly_subscription");
});

function fakeStripe() {
  const calls = [];
  const productMap = new Map();
  const priceMap = new Map([
    [
      "price_month",
      {
        id: "price_month",
        active: true,
        currency: "jpy",
        unit_amount: 500,
        recurring: { interval: "month", interval_count: 1 },
      },
    ],
  ]);
  const sessions = new Map();
  let serial = 0;
  return {
    calls,
    priceMap,
    sessions,
    products: {
      list: () => ({
        async *[Symbol.asyncIterator]() {
          yield* productMap.values();
        },
      }),
      create: async (args, options) => {
        calls.push(["product", args, options]);
        const product = { id: `prod:${++serial}`, ...args };
        productMap.set(product.id, product);
        return product;
      },
      retrieve: async (id) => productMap.get(id) ?? { id },
      update: async (id, args) => {
        calls.push(["product.update", id, args]);
        return { id, ...args };
      },
    },
    prices: {
      list: ({ product }) => ({
        async *[Symbol.asyncIterator]() {
          for (const price of priceMap.values())
            if (price.product === product) yield price;
        },
      }),
      create: async (args, options) => {
        calls.push(["price", args, options]);
        const price = { id: `price:${++serial}`, active: true, ...args };
        priceMap.set(price.id, price);
        return price;
      },
      retrieve: async (id) => priceMap.get(id),
    },
    checkout: {
      sessions: {
        create: async (args, options) => {
          calls.push(["checkout", args, options]);
          const session = {
            id: `cs:${++serial}`,
            status: "open",
            url: "https://checkout.stripe.test/session",
            expires_at: args.expires_at,
            ...args,
          };
          sessions.set(session.id, session);
          return session;
        },
        retrieve: async (id) => sessions.get(id),
        expire: async (id) => {
          const session = sessions.get(id);
          session.status = "expired";
          return session;
        },
        list: () => ({
          async *[Symbol.asyncIterator]() {
            yield* sessions.values();
          },
        }),
      },
    },
    customers: { create: async () => ({ id: "cus_created" }) },
    billingPortal: {
      configurations: {
        retrieve: async () => ({
          active: true,
          features: {
            payment_method_update: { enabled: true },
            invoice_history: { enabled: true },
            subscription_cancel: { enabled: true, mode: "at_period_end" },
            subscription_update: { enabled: false },
          },
        }),
      },
      sessions: {
        create: async (args) => {
          calls.push(["portal", args]);
          return { url: "https://billing.stripe.test/portal" };
        },
      },
    },
  };
}

test("course creation provisions monthly and annual prices; replacement pricing leaves subscribers unchanged", async () => {
  const stripe = fakeStripe();
  const db = fixture();
  const runtime = loadBilling({ stripe });
  const actions = runtime.load("stripe");
  const ctx = runtime.context(db, "admin");
  const monthly = await actions.createProduct.handler(ctx, {
    course_name: "New monthly",
    price: 700,
    billing_model: "monthly_subscription",
    parent_course_id: "annual",
  });
  assert.equal(monthly.success, true);
  const monthlyPrice = stripe.calls.find((c) => c[0] === "price")[1];
  assert.equal(monthlyPrice.recurring.interval, "month");
  assert.equal(monthlyPrice.currency, "jpy");
  assert.equal(monthlyPrice.unit_amount, 700);
  const course = await db.get(monthly.course_id);
  assert.equal(course.provisioning_state, "ready");
  const oldPrice = course.stripe_price_id;
  db.add("subscription", "existing_subscription", {
    course_id: monthly.course_id,
    stripe_price_id: oldPrice,
    price: 700,
  });
  await actions.updateCoursePricing.handler(ctx, {
    course_id: monthly.course_id,
    price: 800,
  });
  assert.notEqual((await db.get(monthly.course_id)).stripe_price_id, oldPrice);
  assert.equal((await db.get("existing_subscription")).price, 700);
  assert.equal(
    (await db.get("existing_subscription")).stripe_price_id,
    oldPrice,
  );
  await actions.createProduct.handler(ctx, {
    course_name: "New annual",
    price: 4500,
  });
  assert.equal(
    stripe.calls.filter((c) => c[0] === "price").at(-1)[1].recurring,
    undefined,
  );
  await assert.rejects(
    actions.createProduct.handler(runtime.context(db, "user"), {
      course_name: "Denied",
      price: 500,
    }),
    /admin/,
  );
  await assert.rejects(
    actions.createProduct.handler(ctx, { course_name: "Invalid", price: 5.5 }),
    /integer in JPY/,
  );
});

test("monthly checkout is card-only, one student, starts without trial, and retries reuse the session", async () => {
  const stripe = fakeStripe();
  const db = addonFixture();
  const runtime = loadBilling({ stripe });
  const actions = runtime.load("subscriptions");
  const ctx = runtime.context(db);
  const result = await actions.createMonthlyCheckout.handler(ctx, {
    course_id: "monthly",
    student_id: "monthlystudent",
  });
  const again = await actions.createMonthlyCheckout.handler(ctx, {
    course_id: "monthly",
    student_id: "monthlystudent",
  });
  assert.equal(again.attempt_id, result.attempt_id);
  const requests = stripe.calls.filter((c) => c[0] === "checkout");
  assert.equal(requests.length, 1);
  const params = requests[0][1];
  assert.equal(params.mode, "subscription");
  assert.equal(params.payment_method_types[0], "card");
  assert.equal(params.line_items.length, 1);
  assert.equal(params.line_items[0].quantity, 1);
  assert.equal(
    params.subscription_data.metadata.monthly_attempt_id,
    result.attempt_id,
  );
  assert.equal(params.subscription_data.trial_period_days, undefined);
  assert.match(requests[0][2].idempotencyKey, /monthly-checkout:/);
});

test("dashboard return expires checkout and lets the member choose another add-on", async () => {
  const stripe = fakeStripe();
  const db = addonFixture();
  const runtime = loadBilling({ stripe });
  const actions = runtime.load("subscriptions");
  const ctx = runtime.context(db);
  const first = await actions.createMonthlyCheckout.handler(ctx, {
    course_id: "monthly",
    student_id: "monthlystudent",
  });
  const attempt = await db.get(first.attempt_id);
  assert.equal(
    stripe.sessions.get(attempt.stripe_session_id).cancel_url,
    "https://example.test/dashboard/members",
  );
  await actions.abandonMonthlyCheckouts.handler(
    runtime.context(db, "other"),
    {},
  );
  assert.equal((await db.get(first.attempt_id)).status, "open");
  await actions.abandonMonthlyCheckouts.handler(ctx, {});
  await actions.abandonMonthlyCheckouts.handler(ctx, {});
  assert.equal((await db.get(first.attempt_id)).status, "expired");
  assert.equal(
    stripe.sessions.get(attempt.stripe_session_id).status,
    "expired",
  );
  assert.equal((await db.get("monthlystudent")).status, "active");
  assert.equal(db.table("subscription").length, 0);
  db.add("course", "another_monthly", {
    ...db.rows.get("monthly"),
    parent_course_id: "annual",
  });
  // MemoryDB.add copies fields verbatim; preserve the new course's identity.
  db.rows.get("another_monthly")._id = "another_monthly";
  const next = await actions.createMonthlyCheckout.handler(ctx, {
    course_id: "another_monthly",
    student_id: "monthlystudent",
  });
  assert.notEqual(next.attempt_id, first.attempt_id);
  assert.equal((await db.get(next.attempt_id)).course_id, "another_monthly");
});

test("dashboard return recovers an unsaved session and keeps the lock if Stripe expiration fails", async () => {
  const stripe = fakeStripe();
  const db = addonFixture();
  const runtime = loadBilling({ stripe });
  const ctx = runtime.context(db);
  const actions = runtime.load("subscriptions");
  const first = await actions.createMonthlyCheckout.handler(ctx, {
    course_id: "monthly",
    student_id: "monthlystudent",
  });
  const attempt = await db.get(first.attempt_id);
  await db.patch(attempt._id, {
    stripe_session_id: undefined,
    status: "reserved",
  });
  const expire = stripe.checkout.sessions.expire;
  stripe.checkout.sessions.expire = async () => {
    throw new Error("Stripe unavailable");
  };
  await assert.rejects(
    actions.abandonMonthlyCheckouts.handler(ctx, {}),
    /unavailable/,
  );
  assert.equal((await db.get(first.attempt_id)).status, "reserved");
  stripe.checkout.sessions.expire = expire;
  await actions.abandonMonthlyCheckouts.handler(ctx, {});
  assert.equal((await db.get(first.attempt_id)).status, "expired");
  assert.equal(
    stripe.sessions.get(attempt.stripe_session_id).status,
    "expired",
  );
});

test("checkout rejects a mismatched Stripe price and retains its reservation after a timeout", async () => {
  const stripe = fakeStripe();
  stripe.priceMap.get("price_month").unit_amount = 999;
  const db = addonFixture();
  const runtime = loadBilling({ stripe });
  const actions = runtime.load("subscriptions");
  await assert.rejects(
    actions.createMonthlyCheckout.handler(runtime.context(db), {
      course_id: "monthly",
      student_id: "monthlystudent",
    }),
    /price mismatch/,
  );
  assert.equal(db.table("monthly_checkout").length, 1);
  stripe.priceMap.get("price_month").unit_amount = 500;
  stripe.checkout.sessions.create = async () => {
    throw new Error("network timeout");
  };
  await assert.rejects(
    actions.createMonthlyCheckout.handler(runtime.context(db), {
      course_id: "monthly",
      student_id: "monthlystudent",
    }),
    /timeout/,
  );
  assert.ok(db.table("monthly_checkout")[0].error);
  assert.equal(db.table("monthly_checkout")[0].status, "reserved");
});

test("portal belongs to the caller and rejects configurations that enable plan switching", async () => {
  const stripe = fakeStripe();
  const db = fixture();
  const runtime = loadBilling({
    stripe,
    env: { STRIPE_BILLING_PORTAL_CONFIGURATION_ID: "bpc_test" },
  });
  const actions = runtime.load("subscriptions");
  await actions.createBillingPortal.handler(runtime.context(db), {});
  assert.equal(
    stripe.calls.find((c) => c[0] === "portal")[1].customer,
    "cus_test",
  );
  stripe.billingPortal.configurations.retrieve = async () => ({
    active: true,
    features: {
      payment_method_update: { enabled: true },
      invoice_history: { enabled: true },
      subscription_cancel: { enabled: true, mode: "at_period_end" },
      subscription_update: { enabled: true },
    },
  });
  await assert.rejects(
    actions.createBillingPortal.handler(runtime.context(db), {}),
    /configuration/,
  );
  await assert.rejects(
    actions.createBillingPortal.handler(runtime.context(db, "other"), {}),
    /customer/,
  );
});

test("Stripe invoice events retrieve current state, including paid invoices delivered before checkout completion", async () => {
  const stripe = fakeStripe();
  const f = await reservedFixture({ stripe });
  const { db, runtime, ctx, attempt, now } = f;
  const subscription = {
    id: "sub_test",
    billing_cycle_anchor: Math.floor(now / 1000),
    metadata: { monthly_attempt_id: attempt._id },
    customer: "cus_test",
    status: "active",
    items: {
      data: [
        {
          id: "si_test",
          quantity: 1,
          price: stripe.priceMap.get("price_month"),
          current_period_start: Math.floor(now / 1000),
          current_period_end: Math.floor((now + 30 * day) / 1000),
        },
      ],
    },
    cancel_at_period_end: false,
  };
  const invoice = {
    id: "in_webhook",
    status: "paid",
    customer: "cus_test",
    parent: { subscription_details: { subscription: "sub_test" } },
    amount_paid: 500,
    currency: "jpy",
    attempt_count: 1,
  };
  stripe.subscriptions = {
    retrieve: async () => subscription,
    update: async (_id, fields) => {
      if (fields.metadata)
        fields = {
          ...fields,
          metadata: { ...subscription.metadata, ...fields.metadata },
        };
      return Object.assign(subscription, fields);
    },
  };
  stripe.invoices = {
    retrieve: async () => invoice,
    listLineItems: async () => ({
      has_more: false,
      data: [
        {
          parent: {
            subscription_item_details: {
              subscription_item: "si_test",
              proration: false,
            },
          },
          pricing: { price_details: { price: "price_month" } },
          period: {
            start: subscription.items.data[0].current_period_start,
            end: subscription.items.data[0].current_period_end,
          },
        },
      ],
    }),
    list: () => ({
      async *[Symbol.asyncIterator]() {
        yield invoice;
      },
    }),
  };
  const actions = runtime.load("subscriptions");
  // A payment can finish while the returning dashboard tries to expire checkout.
  await runtime.load("billingStore").saveSession.handler(ctx, {
    id: attempt._id,
    session_id: "cs_completed_on_return",
    customer_id: "cus_test",
    expires_at: now + day,
  });
  stripe.sessions.set("cs_completed_on_return", {
    id: "cs_completed_on_return",
    status: "open",
    mode: "subscription",
    customer: "cus_test",
    metadata: { monthly_attempt_id: attempt._id },
    subscription: "sub_test",
  });
  stripe.checkout.sessions.expire = async (id) => {
    stripe.sessions.get(id).status = "complete";
    throw new Error("Checkout just completed");
  };
  await actions.abandonMonthlyCheckouts.handler(ctx, {});
  assert.equal((await db.get(attempt._id)).status, "completed");
  assert.equal(db.table("subscription").length, 1);
  await actions.handleEvent.handler(ctx, {
    event_json: JSON.stringify({
      id: "evt_webhook",
      type: "invoice.paid",
      data: { object: { id: invoice.id } },
    }),
  });
  assert.equal((await db.get("monthlystudent")).status, "active");
  assert.equal(db.table("full_order").length, 1);
  const row = db.table("subscription")[0];
  const paidThrough = row.paid_through;
  await actions.scheduleCancellation.handler(ctx, { subscription_id: row._id });
  assert.equal(db.table("subscription")[0].cancel_at_period_end, true);
  assert.equal(db.table("subscription")[0].paid_through, paidThrough);
  await actions.undoCancellation.handler(ctx, { subscription_id: row._id });
  assert.equal(db.table("subscription")[0].cancel_at_period_end, false);
  await db.patch(row._id, { next_reconcile_at: now - day });
  await actions.reconcile.handler(ctx, {});
  assert.equal(db.table("full_order").length, 1);
  subscription.metadata = {};
  await actions.handleEvent.handler(ctx, {
    event_json: JSON.stringify({
      id: "evt_unrelated",
      type: "customer.subscription.updated",
      data: { object: { id: "sub_unrelated" } },
    }),
  });
  assert.equal(db.table("subscription").length, 1);
});

test("invalid webhook signatures never mutate the database", async () => {
  const stripe = fakeStripe();
  stripe.webhooks = {
    constructEventAsync: async () => {
      throw new Error("bad signature");
    },
  };
  const db = fixture();
  const runtime = loadBilling({
    stripe,
    env: { STRIPE_WEBHOOK_SECRET: "whsec_fake" },
  });
  const result = await runtime
    .load("stripe")
    .fulfill.handler(runtime.context(db), {
      payload: "untrusted payload",
      signature: "invalid",
    });
  assert.equal(result.success, false);
  assert.equal(result.invalid_signature, true);
  assert.equal(db.table("subscription").length, 0);
  assert.equal(db.table("full_order").length, 0);
});

test("annual activation codes and internal renewals cannot extend monthly students", async () => {
  const db = fixture();
  const runtime = loadBilling();
  const ctx = runtime.context(db);
  const mutations = runtime.load("mutations/student");
  await db.patch("monthlystudent", {
    user_id: "user",
    status: "active",
    expiry_date: Date.now() + day,
  });
  await assert.rejects(
    mutations.renewStudent.handler(ctx, { student_id: "monthlystudent" }),
    /Monthly/,
  );
  await assert.rejects(
    mutations.reactivateStudent.handler(ctx, { student_id: "monthlystudent" }),
    /Monthly/,
  );
  db.add("activation_code", "code", {
    activation_code: "ABCDEF",
    course: "monthly",
    organization_id: "org",
  });
  const result = await mutations.activateStudentByActivationCode.handler(ctx, {
    activation_code: "ABCDEF",
    user_id: "user",
  });
  assert.equal(result.success, false);
  await assert.rejects(
    runtime
      .load("mutations/activation_code")
      .createActivationCode.handler(runtime.context(db, "admin"), {
        course_id: "monthly",
        student_id: "monthlystudent",
        organization_id: "org",
      }),
    /annual/,
  );
});

test("concurrent reservations and invoice deliveries cannot double allocate or bill locally", async () => {
  const db = addonFixture();
  const runtime = loadBilling();
  const store = runtime.load("billingStore");
  const ctx = runtime.context(db);
  const attempts = await Promise.all(
    [0, 1].map(() =>
      db.transaction(() =>
        store.reserve.handler(ctx, {
          course_id: "monthly",
          student_id: "monthlystudent",
        }),
      ),
    ),
  );
  assert.equal(attempts[0]._id, attempts[1]._id);
  assert.equal(db.table("monthly_checkout").length, 1);
  const f = await reservedFixture();
  const invoice = {
    id: "in_concurrent",
    amount: 500,
    currency: "jpy",
    period_start: f.snapshot.period_start,
    period_end: f.snapshot.period_end,
    paid: true,
    failed: false,
  };
  await Promise.all(
    [0, 1].map((i) => f.apply({ invoice, event_id: `evt_concurrent:${i}` })),
  );
  assert.equal(f.db.table("full_order").length, 1);
  assert.equal(f.db.table("student_order").length, 1);
});

test("catalog provisioning retry recovers existing Product and Price after a partial failure", async () => {
  const stripe = fakeStripe();
  const db = fixture();
  const runtime = loadBilling({ stripe });
  const actions = runtime.load("stripe");
  const ctx = runtime.context(db, "admin");
  const update = stripe.products.update;
  stripe.products.update = async () => {
    throw new Error("temporary Stripe failure");
  };
  const args = {
    course_name: "Retry monthly",
    price: 700,
    billing_model: "monthly_subscription",
    parent_course_id: "annual",
  };
  assert.equal((await actions.createProduct.handler(ctx, args)).success, false);
  assert.equal(
    db.table("course").find((c) => c.course_name === args.course_name)
      .provisioning_state,
    "failed",
  );
  stripe.products.update = update;
  assert.equal((await actions.createProduct.handler(ctx, args)).success, true);
  assert.equal(stripe.calls.filter((c) => c[0] === "product").length, 1);
  assert.equal(stripe.calls.filter((c) => c[0] === "price").length, 1);
});

test("older lifecycle observations cannot undo cancellation; administrative removal denies access", async () => {
  const f = await reservedFixture();
  await f.apply({
    invoice: {
      id: "in_paid",
      amount: 500,
      currency: "jpy",
      period_start: f.snapshot.period_start,
      period_end: f.snapshot.period_end,
      paid: true,
      failed: false,
    },
    observed_at: f.now,
  });
  await f.apply({
    snapshot: { ...f.snapshot, cancel_at_period_end: true },
    observed_at: f.now + 100,
  });
  await f.apply({ snapshot: f.snapshot, observed_at: f.now - 100 });
  const row = f.db.table("subscription")[0];
  assert.equal(row.cancel_at_period_end, true);
  await f.db.patch("monthlystudent", { status: "removed" });
  assert.equal(
    (await f.store.getSubscription.handler(f.ctx, { id: row._id })).has_access,
    false,
  );
  await f.apply({});
  assert.equal((await f.db.get("monthlystudent")).status, "removed");
  await assert.rejects(
    f.runtime
      .load("mutations/student")
      .editStudent.handler(f.runtime.context(f.db, "admin"), {
        student_id: "monthlystudent",
        classroom_id: "monthlyroom",
      }),
    /switch billing models/,
  );
});
