import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";
import {
  authedQuery,
  adminQuery,
  adminMutation,
  canAccessUser,
  getAuthenticatedUser,
  requireUserAccess,
} from "./lib/auth";
import {
  accessDeadline,
  studentCourse,
  blocksAddon,
  DAY_MS,
  GRACE_MS,
  isAnnual,
} from "./lib/billing";
import { generateOrderNumber } from "./mutations/full_order";
import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";
import type { QueryCtx } from "./_generated/server";

async function hasSubscriptionAccess(
  ctx: Pick<QueryCtx, "db">,
  row: Doc<"subscription">,
) {
  const student = await ctx.db.get(row.student_id);
  return (
    !!student &&
    student.user_id === row.user_id &&
    student.status !== "removed" &&
    (await ctx.db.get(row.user_id))?.status !== "inactive" &&
    Date.now() < accessDeadline(row)
  );
}

export const payer = internalQuery({ args: {}, handler: getAuthenticatedUser });

export const memberPendingAttempts = internalQuery({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthenticatedUser(ctx);
    const attempts = await ctx.db
      .query("monthly_checkout")
      .withIndex("by_user_course", (q) => q.eq("user_id", user._id))
      .collect();
    return attempts.filter(
      (a) => a.status === "reserved" || a.status === "open",
    );
  },
});

export const reserve = internalMutation({
  args: { course_id: v.id("course"), student_id: v.id("student") },
  handler: async (ctx, { course_id, student_id }) => {
    const user = await getAuthenticatedUser(ctx);
    if (process.env.MONTHLY_SUBSCRIPTIONS_ENABLED !== "true")
      throw new Error("Monthly checkout is disabled");
    const course = await ctx.db.get(course_id);
    if (
      !course ||
      isAnnual(course) ||
      course.status !== "active" ||
      course.provisioning_state !== "ready" ||
      !course.stripe_price_id
    )
      throw new Error("Monthly course unavailable");
    const student = await ctx.db.get(student_id);
    const base = student ? await studentCourse(ctx, student) : null;
    if (
      !student ||
      student.user_id !== user._id ||
      user.status === "inactive" ||
      student.status !== "active" ||
      !student.expiry_date ||
      student.expiry_date <= Date.now() ||
      !base ||
      !isAnnual(base) ||
      course.parent_course_id !== base._id
    )
      throw new Error("An active owned annual enrollment is required");
    const attempts = await ctx.db
      .query("monthly_checkout")
      .withIndex("by_student", (q) => q.eq("student_id", student_id))
      .collect();
    const pending = attempts.find(
      (a) => a.status === "reserved" || a.status === "open",
    );
    if (pending) {
      if (pending.user_id !== user._id || pending.course_id !== course_id)
        throw new Error("Student already has a pending add-on checkout");
      return pending;
    }
    if (student.expiry_date - Date.now() < 31 * 60 * 1000)
      throw new Error(
        "Renew the annual course before starting an add-on near expiry",
      );
    const subscriptions = await ctx.db
      .query("subscription")
      .withIndex("by_student", (q) => q.eq("student_id", student_id))
      .collect();
    if (subscriptions.some((s) => blocksAddon(s)))
      throw new Error("Student already subscribed");
    const id = await ctx.db.insert("monthly_checkout", {
      user_id: user._id,
      course_id,
      student_id: student._id,
      stripe_price_id: course.stripe_price_id,
      price: course.price,
      created_at: Date.now(),
      expires_at: Math.min(Date.now() + DAY_MS, student.expiry_date),
      status: "reserved",
    });
    return (await ctx.db.get(id))!;
  },
});

export const attempt = internalQuery({
  args: { id: v.id("monthly_checkout") },
  handler: (ctx, { id }) => ctx.db.get(id),
});

export const saveSession = internalMutation({
  args: {
    id: v.id("monthly_checkout"),
    session_id: v.string(),
    customer_id: v.string(),
    expires_at: v.number(),
  },
  handler: async (ctx, args) => {
    const row = await ctx.db.get(args.id);
    if (!row || row.status === "expired")
      throw new Error("Checkout reservation unavailable");
    if (row.stripe_session_id && row.stripe_session_id !== args.session_id)
      throw new Error("Checkout session mismatch");
    await ctx.db.patch(row._id, {
      stripe_session_id: args.session_id,
      stripe_customer_id: args.customer_id,
      expires_at: args.expires_at,
      status: row.status === "completed" ? "completed" : "open",
      error: undefined,
    });
  },
});

export const expireAttempt = internalMutation({
  args: { id: v.id("monthly_checkout"), session_id: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const row = await ctx.db.get(args.id);
    if (!row || row.status === "completed") return;
    if (row.stripe_session_id && row.stripe_session_id !== args.session_id)
      throw new Error("Session mismatch");
    const student = await ctx.db.get(row.student_id);
    if (student?.checkout_attempt_id === row._id)
      await ctx.db.patch(student._id, { checkout_attempt_id: undefined });
    await ctx.db.patch(row._id, { status: "expired" });
  },
});

export const recordAttemptError = internalMutation({
  args: { id: v.id("monthly_checkout"), error: v.string() },
  handler: (ctx, args) => ctx.db.patch(args.id, { error: args.error }),
});

export const getSubscription = authedQuery({
  args: { id: v.id("subscription") },
  handler: async (ctx, { id }) => {
    const row = await ctx.db.get(id);
    if (!row) throw new Error("Subscription not found");
    const user = await ctx.db.get(row.user_id);
    if (!user) throw new Error("Payer not found");
    requireUserAccess(ctx.user, user);
    return { ...row, has_access: await hasSubscriptionAccess(ctx, row) };
  },
});

export const listSubscriptions = authedQuery({
  args: { user_id: v.optional(v.id("userTable")) },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.user_id ?? ctx.user._id);
    if (!user) throw new Error("Payer not found");
    requireUserAccess(ctx.user, user);
    const rows = await ctx.db
      .query("subscription")
      .withIndex("by_user", (q) => q.eq("user_id", user._id))
      .collect();
    return Promise.all(
      rows.map(async (row) => ({
        ...row,
        has_access: await hasSubscriptionAccess(ctx, row),
      })),
    );
  },
});

export const authorizedSubscription = internalQuery({
  args: { id: v.id("subscription") },
  handler: async (ctx, { id }) => {
    const caller = await getAuthenticatedUser(ctx);
    const row = await ctx.db.get(id);
    if (!row) throw new Error("Subscription not found");
    const user = await ctx.db.get(row.user_id);
    if (!user) throw new Error("Payer not found");
    requireUserAccess(caller, user);
    if (
      caller._id !== user._id &&
      caller.role !== "admin" &&
      caller.role !== "god"
    )
      throw new Error("Billing control denied");
    return row;
  },
});

export const enrollment = internalQuery({
  args: { student_id: v.id("student") },
  handler: async (ctx, args) => {
    const student = await ctx.db.get(args.student_id);
    const course = student ? await studentCourse(ctx, student) : null;
    return { student, course };
  },
});

export const studentSubscriptions = internalQuery({
  args: { student_id: v.id("student") },
  handler: (ctx, args) =>
    ctx.db
      .query("subscription")
      .withIndex("by_student", (q) => q.eq("student_id", args.student_id))
      .collect(),
});

async function subscriptionView(
  ctx: Pick<QueryCtx, "db">,
  row: Doc<"subscription">,
) {
  const student = await ctx.db.get(row.student_id);
  const course = await ctx.db.get(row.course_id);
  const user = await ctx.db.get(row.user_id);
  const access = await hasSubscriptionAccess(ctx, row);
  return {
    ...row,
    student_name: student?.username ?? "",
    course_name: course?.course_name ?? "",
    email: user?.email ?? "",
    annual_expiry: student?.expiry_date,
    has_access: access,
    activation_required: access !== (row.platform_enabled ?? false),
    next_billing_at:
      !row.payment_failed &&
      !row.cancel_at_period_end &&
      !["canceled", "incomplete_expired"].includes(row.status) &&
      row.period_end > Date.now() &&
      row.period_end < (row.renewal_stop_at ?? Infinity)
        ? row.period_end
        : undefined,
    can_resume:
      student?.status === "active" && (student.expiry_date ?? 0) > Date.now(),
    can_manage: false,
  };
}

export const memberBilling = authedQuery({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db
      .query("subscription")
      .withIndex("by_user", (q) => q.eq("user_id", ctx.user._id))
      .collect();
    const students = await ctx.db
      .query("student")
      .withIndex("by_user_id", (q) => q.eq("user_id", ctx.user._id))
      .collect();
    const enrollments = await Promise.all(
      students.map(async (student) => ({
        ...student,
        base_course_id: (await studentCourse(ctx, student))?._id,
        enrollment_active:
          student.status === "active" &&
          (student.expiry_date ?? 0) > Date.now() &&
          ctx.user.status !== "inactive",
        eligible:
          student.status === "active" &&
          (student.expiry_date ?? 0) > Date.now() + 31 * 60 * 1000 &&
          ctx.user.status !== "inactive",
      })),
    );
    const courses = (await ctx.db.query("course").collect()).filter(
      (c) =>
        c.billing_model === "monthly_subscription" &&
        c.parent_course_id &&
        c.status === "active" &&
        c.provisioning_state === "ready",
    );
    const attempts = (
      await Promise.all(
        students.map((student) =>
          ctx.db
            .query("monthly_checkout")
            .withIndex("by_student", (q) => q.eq("student_id", student._id))
            .collect(),
        ),
      )
    )
      .flat()
      .filter(
        (a) =>
          a.user_id === ctx.user._id &&
          (a.status === "reserved" || a.status === "open"),
      );
    return {
      enabled: process.env.MONTHLY_SUBSCRIPTIONS_ENABLED === "true",
      students: enrollments,
      courses,
      subscriptions: await Promise.all(
        rows.map(async (row) => ({
          ...(await subscriptionView(ctx, row)),
          can_manage: true,
        })),
      ),
      attempts,
    };
  },
});

export const adminSubscriptions = adminQuery({
  args: {
    cursor: v.optional(v.string()),
    user_id: v.optional(v.id("userTable")),
    course_id: v.optional(v.id("course")),
    student_id: v.optional(v.id("student")),
    classroom_id: v.optional(v.id("classroom")),
    activation_only: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    if (args.user_id) {
      const user = await ctx.db.get(args.user_id);
      if (!user) throw new Error("Payer not found");
      requireUserAccess(ctx.user, user);
    }
    if (ctx.user.role === "org_admin" && !ctx.user.org_id)
      return { page: [], isDone: true, continueCursor: "" };
    const query = args.user_id
      ? ctx.db
          .query("subscription")
          .withIndex("by_user", (q) => q.eq("user_id", args.user_id!))
      : ctx.user.role === "org_admin"
        ? ctx.db
            .query("subscription")
            .withIndex("by_organization", (q) =>
              q.eq("organization_id", ctx.user.org_id),
            )
        : args.activation_only
          ? ctx.db
              .query("subscription")
              .withIndex("by_activation_required", (q) =>
                q.eq("activation_required", true),
              )
          : args.course_id
            ? ctx.db
                .query("subscription")
                .withIndex("by_course", (q) =>
                  q.eq("course_id", args.course_id!),
                )
            : args.student_id
              ? ctx.db
                  .query("subscription")
                  .withIndex("by_student", (q) =>
                    q.eq("student_id", args.student_id!),
                  )
              : ctx.db.query("subscription");
    const page = await query.paginate({
      cursor: args.cursor ?? null,
      numItems: 100,
    });
    const rows = [];
    for (const row of page.page) {
      const payer = await ctx.db.get(row.user_id);
      const student = await ctx.db.get(row.student_id);
      if (args.classroom_id && student?.classroom_id !== args.classroom_id)
        continue;
      if (args.student_id && row.student_id !== args.student_id) continue;
      if (args.course_id && row.course_id !== args.course_id) continue;
      if (payer && canAccessUser(ctx.user, payer))
        rows.push({
          ...(await subscriptionView(ctx, row)),
          can_activate: ctx.user.role === "admin" || ctx.user.role === "god",
          can_manage:
            ctx.user.role !== "org_admin" || ctx.user._id === row.user_id,
        });
    }
    return { ...page, page: rows };
  },
});

export const acknowledgeActivation = adminMutation({
  args: { subscription_id: v.id("subscription"), enabled: v.boolean() },
  handler: async (ctx, args) => {
    if (ctx.user.role !== "admin" && ctx.user.role !== "god")
      throw new Error("Global admin access required");
    const row = await ctx.db.get(args.subscription_id);
    if (!row) throw new Error("Subscription not found");
    const user = await ctx.db.get(row.user_id);
    if (!user) throw new Error("Payer not found");
    requireUserAccess(ctx.user, user);
    const desired = await hasSubscriptionAccess(ctx, row);
    if (args.enabled !== desired)
      throw new Error("Entitlement changed; refresh the activation task");
    if ((row.platform_enabled ?? false) === desired) {
      await ctx.db.patch(row._id, { activation_required: false });
      return;
    }
    await ctx.db.patch(row._id, {
      platform_enabled: desired,
      activation_required: false,
      platform_updated_at: Date.now(),
    });
    await ctx.db.insert("subscription_activation", {
      subscription_id: row._id,
      administrator_id: ctx.user._id,
      enabled: desired,
      created_at: Date.now(),
    });
  },
});

export const activationHistory = adminQuery({
  args: { subscription_id: v.id("subscription") },
  handler: async (ctx, args) => {
    const row = await ctx.db.get(args.subscription_id);
    const user = row ? await ctx.db.get(row.user_id) : null;
    if (!user) throw new Error("Payer not found");
    requireUserAccess(ctx.user, user);
    const history = await ctx.db
      .query("subscription_activation")
      .withIndex("by_subscription", (q) =>
        q.eq("subscription_id", args.subscription_id),
      )
      .collect();
    return Promise.all(
      history.map(async (entry) => {
        const administrator = await ctx.db.get(entry.administrator_id);
        return {
          ...entry,
          administrator_name:
            administrator && canAccessUser(ctx.user, administrator)
              ? [administrator.first_name, administrator.last_name]
                  .filter(Boolean)
                  .join(" ")
              : undefined,
        };
      }),
    );
  },
});

export const checkoutStatus = authedQuery({
  args: { attempt_id: v.id("monthly_checkout") },
  handler: async (ctx, args) => {
    const attempt = await ctx.db.get(args.attempt_id);
    if (!attempt || attempt.user_id !== ctx.user._id)
      throw new Error("Checkout access denied");
    const rows = await ctx.db
      .query("subscription")
      .withIndex("by_student", (q) => q.eq("student_id", attempt.student_id))
      .collect();
    const row = rows.find((s) => s.checkout_attempt_id === attempt._id);
    return {
      status: attempt.status,
      error: !!attempt.error,
      subscription: row ? await subscriptionView(ctx, row) : null,
    };
  },
});

const subscriptionSnapshot = v.object({
  attempt_id: v.id("monthly_checkout"),
  stripe_subscription_id: v.string(),
  stripe_customer_id: v.string(),
  stripe_item_id: v.string(),
  stripe_price_id: v.string(),
  status: v.string(),
  period_start: v.number(),
  period_end: v.number(),
  cancel_at_period_end: v.boolean(),
  cancel_at: v.optional(v.number()),
  canceled_at: v.optional(v.number()),
  ended_at: v.optional(v.number()),
  annual_expires_at: v.optional(v.number()),
  renewal_stop_at: v.optional(v.number()),
  cancellation_reason: v.optional(
    v.union(v.literal("member"), v.literal("annual_expiry")),
  ),
});
const invoiceSnapshot = v.object({
  id: v.string(),
  amount: v.number(),
  currency: v.string(),
  period_start: v.number(),
  period_end: v.number(),
  paid: v.boolean(),
  failed: v.boolean(),
});

async function refreshAccess(ctx: MutationCtx, row: Doc<"subscription">) {
  const deadline = accessDeadline(row);
  const student = await ctx.db.get(row.student_id);
  if (!student || student.user_id !== row.user_id)
    throw new Error("Subscription student ownership mismatch");
  await ctx.db.patch(row._id, {
    access_deadline: deadline,
    activation_required:
      (await hasSubscriptionAccess(ctx, row)) !==
      (row.platform_enabled ?? false),
  });
}

export const applySubscription = internalMutation({
  args: {
    snapshot: subscriptionSnapshot,
    invoice: v.optional(invoiceSnapshot),
    event_id: v.string(),
    event_type: v.string(),
    observed_at: v.number(),
  },
  handler: async (ctx, args) => {
    const seen = await ctx.db
      .query("stripe_webhook")
      .withIndex("by_event", (q) => q.eq("event_id", args.event_id))
      .first();
    if (seen) return;
    const s = args.snapshot;
    const attempt = await ctx.db.get(s.attempt_id);
    if (
      !attempt ||
      attempt.status === "expired" ||
      attempt.stripe_price_id !== s.stripe_price_id
    )
      throw new Error("Invalid subscription mapping");
    if (
      attempt.stripe_customer_id &&
      attempt.stripe_customer_id !== s.stripe_customer_id
    )
      throw new Error("Subscription customer mismatch");
    const payer = await ctx.db.get(attempt.user_id);
    if (!payer || payer.stripe_id !== s.stripe_customer_id)
      throw new Error("Payer customer mismatch");
    let row = await ctx.db
      .query("subscription")
      .withIndex("by_stripe_id", (q) =>
        q.eq("stripe_subscription_id", s.stripe_subscription_id),
      )
      .first();
    if (!row) {
      const student = await ctx.db.get(attempt.student_id);
      if (!student || student.user_id !== attempt.user_id)
        throw new Error("Student reservation mismatch");
      const previous = await ctx.db
        .query("subscription")
        .withIndex("by_student", (q) => q.eq("student_id", student._id))
        .collect();
      if (previous.some((r) => blocksAddon(r)))
        throw new Error("Student already subscribed");
      const { attempt_id: _attempt, ...fields } = s;
      void _attempt;
      const id = await ctx.db.insert("subscription", {
        ...fields,
        checkout_attempt_id: attempt._id,
        user_id: attempt.user_id,
        organization_id: payer.org_id,
        student_id: attempt.student_id,
        course_id: attempt.course_id,
        price: attempt.price,
        paid_through: 0,
        payment_failed: false,
        access_deadline: 0,
        next_reconcile_at: Date.now() + DAY_MS,
        platform_enabled: false,
        updated_at: args.observed_at,
      });

      row = (await ctx.db.get(id))!;
    }
    if (row.checkout_attempt_id !== attempt._id)
      throw new Error("Subscription attempt mismatch");
    // An older in-flight retrieval must not roll back a more recent lifecycle observation.
    if (args.observed_at >= row.updated_at) {
      await ctx.db.patch(row._id, {
        organization_id: payer.org_id,
        status: s.status,
        period_start: s.period_start,
        period_end: s.period_end,
        cancel_at_period_end: s.cancel_at_period_end,
        cancel_at: s.cancel_at,
        canceled_at: s.canceled_at,
        ended_at: s.ended_at,
        annual_expires_at: s.annual_expires_at,
        renewal_stop_at: s.renewal_stop_at,
        cancellation_reason: s.cancellation_reason,
        updated_at: args.observed_at,
        reconciliation_error: undefined,
        next_reconcile_at: Date.now() + DAY_MS,
      });
    }
    await ctx.db.patch(attempt._id, {
      status: "completed",
      stripe_customer_id: s.stripe_customer_id,
      error: undefined,
    });
    const invoice = args.invoice;
    if (invoice) {
      if (
        invoice.currency !== "jpy" ||
        !Number.isSafeInteger(invoice.amount) ||
        invoice.amount < 0 ||
        invoice.period_end <= invoice.period_start
      )
        throw new Error("Invalid invoice");
      const existing = await ctx.db
        .query("full_order")
        .withIndex("by_stripe_invoice", (q) =>
          q.eq("stripe_invoice_id", invoice.id),
        )
        .first();
      if (existing && existing.subscription_id !== row._id)
        throw new Error("Invoice subscription mismatch");
      if (invoice.paid && !existing) {
        const orderId = await ctx.db.insert("full_order", {
          user_id: row.user_id,
          total_amount: invoice.amount,
          subscription_id: row._id,
          stripe_invoice_id: invoice.id,
          currency: invoice.currency,
          period_start: invoice.period_start,
          period_end: invoice.period_end,
          status: "fulfilled",
          updated_date: Date.now(),
          order_number: await generateOrderNumber(ctx),
        });
        await ctx.db.insert("student_order", {
          amount: invoice.amount,
          order_id: orderId,
          student_id: row.student_id,
          order_type: row.paid_through ? "renewal" : "new",
          billing_model: "monthly_subscription",
          course_id: row.course_id,
          course_name: (await ctx.db.get(row.course_id))?.course_name,
          subscription_id: row._id,
          period_start: invoice.period_start,
          period_end: invoice.period_end,
          created_date: Date.now(),
          updated_on: Date.now(),
        });
        if (invoice.period_end >= row.paid_through)
          await ctx.db.patch(row._id, {
            paid_through: invoice.period_end,
            payment_failed: false,
            grace_deadline: undefined,
          });
      } else if (
        invoice.failed &&
        !existing &&
        invoice.period_end > row.paid_through
      ) {
        await ctx.db.patch(row._id, {
          payment_failed: true,
          grace_deadline: row.paid_through
            ? row.paid_through + GRACE_MS
            : undefined,
        });
      }
    }
    await refreshAccess(ctx, (await ctx.db.get(row._id))!);
    await ctx.db.insert("stripe_webhook", {
      event_id: args.event_id,
      event_type: args.event_type,
      processed_at: Date.now(),
    });
  },
});

export const expireAccess = internalMutation({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db
      .query("subscription")
      .withIndex("by_access_deadline", (q) =>
        q.gt("access_deadline", 0).lte("access_deadline", Date.now()),
      )
      .take(100);
    for (const row of rows) {
      await refreshAccess(ctx, row);
      await ctx.db.patch(row._id, { access_deadline: 0 });
    }
  },
});

export const dueReconciliation = internalQuery({
  args: {},
  handler: (ctx) =>
    ctx.db
      .query("subscription")
      .withIndex("by_reconcile", (q) => q.lte("next_reconcile_at", Date.now()))
      .take(50),
});
export const paidInvoiceIds = internalQuery({
  args: { subscription_id: v.id("subscription") },
  handler: async (ctx, args) => {
    const orders = await ctx.db
      .query("full_order")
      .withIndex("by_subscription", (q) =>
        q.eq("subscription_id", args.subscription_id),
      )
      .collect();
    return orders.flatMap((order) =>
      order.stripe_invoice_id ? [order.stripe_invoice_id] : [],
    );
  },
});
export const pendingAttempts = internalQuery({
  args: {},
  handler: async (ctx) => {
    const reserved = await ctx.db
      .query("monthly_checkout")
      .withIndex("by_status_expiry", (q) =>
        q.eq("status", "reserved").lte("expires_at", Date.now()),
      )
      .take(25);
    const open = await ctx.db
      .query("monthly_checkout")
      .withIndex("by_status_expiry", (q) =>
        q.eq("status", "open").lte("expires_at", Date.now()),
      )
      .take(25);
    return [...reserved, ...open];
  },
});
export const reconciliationError = internalMutation({
  args: { id: v.id("subscription"), error: v.string() },
  handler: (ctx, args) =>
    ctx.db.patch(args.id, {
      reconciliation_error: args.error,
      next_reconcile_at: Date.now() + DAY_MS,
    }),
});

export const backfillCourses = internalMutation({
  args: { cursor: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const page = await ctx.db
      .query("course")
      .paginate({ cursor: args.cursor ?? null, numItems: 100 });
    for (const course of page.page)
      if (!course.billing_model)
        await ctx.db.patch(course._id, {
          billing_model: "annual_purchase",
          provisioning_state: course.stripe_price_id ? "ready" : "failed",
        });
    return { cursor: page.continueCursor, done: page.isDone };
  },
});

export const billingIssues = authedQuery({
  args: {},
  handler: async (ctx) => {
    if (ctx.user.role !== "admin" && ctx.user.role !== "god")
      throw new Error("Global admin access required");
    const issues = {
      courses: [
        ...(await ctx.db
          .query("course")
          .withIndex("by_provisioning", (q) =>
            q.eq("provisioning_state", "failed"),
          )
          .take(100)),
        ...(await ctx.db
          .query("course")
          .withIndex("by_provisioning", (q) =>
            q.eq("provisioning_state", "pending"),
          )
          .take(100)),
      ],
      subscriptions: await ctx.db
        .query("subscription")
        .withIndex("by_error", (q) => q.gt("reconciliation_error", undefined))
        .take(100),
      checkouts: [
        ...(await ctx.db
          .query("monthly_checkout")
          .withIndex("by_status_expiry", (q) => q.eq("status", "reserved"))
          .take(100)),
        ...(await ctx.db
          .query("monthly_checkout")
          .withIndex("by_status_expiry", (q) => q.eq("status", "open"))
          .take(100)),
      ].filter((a) => a.error),
    };
    const tasks = await ctx.db
      .query("subscription")
      .withIndex("by_activation_required", (q) =>
        q.eq("activation_required", true),
      )
      .take(100);
    const permitted = new Set<Id<"userTable">>();
    for (const id of new Set(
      [...issues.subscriptions, ...issues.checkouts, ...tasks].map(
        (row) => row.user_id,
      ),
    )) {
      const payer = await ctx.db.get(id);
      if (payer && canAccessUser(ctx.user, payer)) permitted.add(id);
    }
    return {
      ...issues,
      subscriptions: issues.subscriptions.filter((row) =>
        permitted.has(row.user_id),
      ),
      checkouts: issues.checkouts.filter((row) => permitted.has(row.user_id)),
      activation_tasks_count: tasks.filter((row) => permitted.has(row.user_id))
        .length,
    };
  },
});
