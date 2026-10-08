import { internal } from "./_generated/api";
import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { getAuthenticatedUser } from "./lib/auth";
import { availableStudents, isAnnual, studentCourse } from "./lib/billing";
import { generateOrderNumber } from "./mutations/full_order";

type Purchase = NonNullable<Doc<"full_order">["purchase_snapshot"]>[number];

async function snapshotCart(
  ctx: MutationCtx,
  cart: Doc<"cart">,
  prices: { price_id: string; amount: number }[],
  newPriceId: string,
): Promise<Purchase[]> {
  if (
    !Number.isSafeInteger(cart.new_students) ||
    cart.new_students < 0 ||
    cart.new_students > 100
  )
    throw new Error("Invalid student quantity");
  const snapshot: Purchase[] = [];
  for (const id of [...new Set(cart.renewal_students ?? [])]) {
    const student = await ctx.db.get(id);
    if (
      !student ||
      student.user_id !== cart.user_id ||
      student.checkout_attempt_id ||
      student.annual_order_id
    )
      throw new Error("Renewal student unavailable");
    const course = await studentCourse(ctx, student);
    if (
      !course ||
      !isAnnual(course) ||
      course.status !== "active" ||
      (course.provisioning_state && course.provisioning_state !== "ready")
    )
      throw new Error("Annual course unavailable");
    const price = prices.find((p) => p.price_id === course.stripe_price_id);
    if (!price) throw new Error("Renewal price unavailable");
    snapshot.push({
      student_id: id,
      course_id: course._id,
      course_name: course.course_name,
      stripe_price_id: price.price_id,
      amount: price.amount,
      order_type: student.status === "removed" ? "reactivation" : "renewal",
    });
  }
  if (cart.new_students) {
    const course = await ctx.db
      .query("course")
      .withIndex("by_stripe_price", (q) => q.eq("stripe_price_id", newPriceId))
      .first();
    if (
      !course ||
      !isAnnual(course) ||
      course.status !== "active" ||
      (course.provisioning_state && course.provisioning_state !== "ready")
    )
      throw new Error("Default annual course unavailable");
    const price = prices.find((p) => p.price_id === newPriceId);
    if (!price) throw new Error("Annual price unavailable");
    const students = await availableStudents(ctx, course._id);
    if (students.length < cart.new_students)
      throw new Error("Insufficient annual student inventory");
    for (const student of students.slice(0, cart.new_students))
      snapshot.push({
        student_id: student._id,
        course_id: course._id,
        course_name: course.course_name,
        stripe_price_id: newPriceId,
        amount: price.amount,
        order_type: "new",
      });
  }
  if (!snapshot.length) throw new Error("Cart is empty");
  return snapshot;
}

export const prepareCheckout = internalMutation({
  args: {
    cart_id: v.id("cart"),
    new_price_id: v.string(),
    prices: v.array(v.object({ price_id: v.string(), amount: v.number() })),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    const cart = await ctx.db.get(args.cart_id);
    if (!cart || cart.user_id !== user._id)
      throw new Error("Cart access denied");
    const orders = await ctx.db
      .query("full_order")
      .withIndex("by_cart", (q) => q.eq("cart_id", cart._id))
      .collect();
    const pending = orders.find(
      (o) => o.status === "created" || o.status === "pending",
    );
    if (pending) return pending;
    const snapshot = await snapshotCart(
      ctx,
      cart,
      args.prices,
      args.new_price_id,
    );
    const id = await ctx.db.insert("full_order", {
      user_id: user._id,
      cart_id: cart._id,
      total_amount: snapshot.reduce((sum, p) => sum + p.amount, 0),
      currency: "jpy",
      purchase_snapshot: snapshot,
      status: "created",
      updated_date: Date.now(),
      order_number: await generateOrderNumber(ctx),
    });
    for (const item of snapshot)
      await ctx.db.patch(item.student_id, { annual_order_id: id });
    return (await ctx.db.get(id))!;
  },
});

export const fulfillOrder = internalMutation({
  args: {
    session_id: v.string(),
    order_id: v.optional(v.id("full_order")),
    cart_id: v.optional(v.id("cart")),
    amount: v.number(),
    customer_id: v.string(),
  },
  handler: async (ctx, args): Promise<Id<"full_order"> | null> => {
    const order = args.order_id
      ? await ctx.db.get(args.order_id)
      : await ctx.db
          .query("full_order")
          .withIndex("by_stripe_order_id", (q) =>
            q.eq("stripe_order_id", args.session_id),
          )
          .first();
    if (
      !order ||
      (order.stripe_order_id && order.stripe_order_id !== args.session_id)
    )
      throw new Error("Order session mismatch");
    const user = await ctx.db.get(order.user_id);
    if (
      !user ||
      user.stripe_id !== args.customer_id ||
      order.total_amount !== args.amount
    )
      throw new Error("Annual payment mismatch");
    if (order.status === "fulfilled") return null;
    if (order.status === "canceled")
      throw new Error("Canceled order payment requires review");
    let snapshot = order.purchase_snapshot;
    if (!snapshot) {
      // Compatibility for sessions created before deployment. Read and freeze once, inside this transaction.
      const cart = args.cart_id ? await ctx.db.get(args.cart_id) : null;
      if (!cart || cart.user_id !== order.user_id)
        throw new Error("Legacy order cart missing");
      const courses = await ctx.db.query("course").collect();
      const annual = courses.filter((c) => isAnnual(c) && c.stripe_price_id);
      const newCourse = annual.find(
        (c) =>
          c.stripe_product_id ===
          (process.env.STRIPE_ANNUAL_PRODUCT_ID ?? "prod_SXpH8diltRufBp"),
      );
      if (!newCourse?.stripe_price_id && cart.new_students)
        throw new Error("Legacy annual course mapping missing");
      snapshot = await snapshotCart(
        ctx,
        cart,
        annual.map((c) => ({ price_id: c.stripe_price_id!, amount: c.price })),
        newCourse?.stripe_price_id ?? "",
      );
      if (snapshot.reduce((sum, p) => sum + p.amount, 0) !== args.amount)
        throw new Error("Legacy cart changed; manual review required");
    }
    const now = Date.now();
    for (const item of snapshot) {
      const student = await ctx.db.get(item.student_id);
      if (
        !student ||
        (student.annual_order_id && student.annual_order_id !== order._id)
      )
        throw new Error("Student reservation mismatch");
      const course = await studentCourse(ctx, student);
      if (!course || !isAnnual(course) || course._id !== item.course_id)
        throw new Error("Annual course mismatch");
      if (
        item.order_type === "new"
          ? !!student.user_id
          : student.user_id !== order.user_id
      )
        throw new Error("Annual student ownership mismatch");
      const start =
        item.order_type === "renewal" && student.status === "active"
          ? Math.max(student.expiry_date ?? now, now)
          : now;
      const end = new Date(start);
      end.setFullYear(end.getFullYear() + 1);
      await ctx.db.patch(student._id, {
        user_id: order.user_id,
        status: "active",
        expiry_date: end.getTime(),
        updated_on: now,
        annual_order_id: undefined,
      });
      await ctx.scheduler.runAfter(0, internal.subscriptions.syncStudent, {
        student_id: student._id,
      });
      await ctx.db.insert("student_order", {
        student_id: student._id,
        order_id: order._id,
        amount: item.amount,
        order_type: item.order_type,
        billing_model: "annual_purchase",
        course_id: item.course_id,
        course_name:
          item.course_name ?? (await ctx.db.get(item.course_id))?.course_name,
        period_start: start,
        period_end: end.getTime(),
        created_date: now,
        updated_on: now,
      });
    }
    await ctx.db.patch(order._id, {
      stripe_order_id: args.session_id,
      purchase_snapshot: snapshot,
      status: "fulfilled",
      updated_date: now,
    });
    return order._id;
  },
});

export const expireOrder = internalMutation({
  args: { order_id: v.id("full_order"), session_id: v.string() },
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.order_id);
    if (!order || order.status === "fulfilled") return;
    if (order.stripe_order_id && order.stripe_order_id !== args.session_id)
      throw new Error("Order session mismatch");
    for (const item of order.purchase_snapshot ?? []) {
      const student = await ctx.db.get(item.student_id);
      if (student?.annual_order_id === order._id)
        await ctx.db.patch(student._id, { annual_order_id: undefined });
    }
    await ctx.db.patch(order._id, { status: "canceled" });
  },
});

export const pendingOrders = internalQuery({
  args: {},
  handler: async (ctx) => [
    ...(await ctx.db
      .query("full_order")
      .withIndex("by_status_date", (q) =>
        q
          .eq("status", "created")
          .lte("updated_date", Date.now() - 24 * 60 * 60 * 1000),
      )
      .take(25)),
    ...(await ctx.db
      .query("full_order")
      .withIndex("by_status_date", (q) =>
        q
          .eq("status", "pending")
          .lte("updated_date", Date.now() - 24 * 60 * 60 * 1000),
      )
      .take(25)),
  ],
});
