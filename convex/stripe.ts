"use node";

import { v } from "convex/values";
import { action, internalAction } from "./_generated/server";
import type Stripe from "stripe";
import { api, internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import type { ActionCtx } from "./_generated/server";
import { stripeClient, ensureCustomer } from "./lib/stripeBilling";
import { billingModel, isAnnual, validatePrice } from "./lib/billing";

// Read the same Stripe prices used by checkout; never create a session for a preview.
export const getOrderPricing = action({
  args: { student_ids: v.array(v.id("student")) },
  handler: async (
    ctx,
    args,
  ): Promise<{
    newStudent: number;
    renewals: { id: Id<"student">; amount: number }[];
    currency: string;
  }> => {
    if (!(await ctx.auth.getUserIdentity()))
      throw new Error("Not authenticated");
    const students = await ctx.runQuery(
      api.queries.student.getRenewalStudentsWithClassroomAndCourse,
      {
        ids: [...new Set(args.student_ids)],
      },
    );
    const stripe = stripeClient();
    const newPriceId = (await defaultAnnualPrice(stripe)).id;
    const priceIds = [
      ...new Set([
        newPriceId,
        ...students.map((student) => {
          if (
            !isAnnual(student.course) ||
            !student.course.price ||
            !student.course.stripe_price_id
          )
            throw new Error("Price unavailable");
          return student.course.stripe_price_id;
        }),
      ]),
    ];
    const prices = await Promise.all(
      priceIds.map((id) => stripe.prices.retrieve(id)),
    );
    const amount = (id: string) => {
      const price = prices.find((item) => item.id === id);
      // This store charges JPY, whose Stripe amounts are already whole yen.
      if (
        !price ||
        !price.active ||
        price.recurring ||
        price.currency !== "jpy" ||
        price.unit_amount === null
      )
        throw new Error("Price unavailable");
      return price.unit_amount;
    };
    return {
      newStudent: amount(newPriceId),
      renewals: students.map((student) => ({
        id: student.student.id!,
        amount: amount(student.course.stripe_price_id!),
      })),
      currency: "JPY",
    };
  },
});

async function defaultAnnualPrice(stripe: Stripe) {
  const product = await stripe.products.retrieve(
    process.env.STRIPE_ANNUAL_PRODUCT_ID ?? "prod_SXpH8diltRufBp",
  );
  const id =
    typeof product.default_price === "string"
      ? product.default_price
      : product.default_price?.id;
  if (!id) throw new Error("Annual price unavailable");
  return validateAnnualPrice(await stripe.prices.retrieve(id));
}

function validateAnnualPrice(price: Stripe.Price) {
  if (
    !price.active ||
    price.currency !== "jpy" ||
    price.recurring ||
    price.unit_amount === null
  )
    throw new Error("Annual Stripe price mismatch");
  validatePrice(price.unit_amount);
  return price;
}

export const checkout = action({
  args: { cart_id: v.id("cart") },
  handler: async (ctx, args): Promise<string> => {
    const payer = await ctx.runQuery(internal.billingStore.payer, {});
    const cart = await ctx.runQuery(internal.queries.cart.getCartById, {
      id: args.cart_id,
    });
    if (!cart || cart.user_id !== payer._id)
      throw new Error("Cart access denied");
    const students = await ctx.runQuery(
      api.queries.student.getRenewalStudentsWithClassroomAndCourse,
      { ids: [...new Set(cart.renewal_students ?? [])] },
    );
    const stripe = stripeClient();
    const defaultPrice = await defaultAnnualPrice(stripe);
    const ids = [
      ...new Set([
        defaultPrice.id,
        ...students.map((s) => {
          if (!s.course.stripe_price_id || !isAnnual(s.course))
            throw new Error("Annual renewal unavailable");
          return s.course.stripe_price_id;
        }),
      ]),
    ];
    const prices = await Promise.all(
      ids.map(async (id) =>
        validateAnnualPrice(await stripe.prices.retrieve(id)),
      ),
    );
    const order = await ctx.runMutation(
      internal.annualBilling.prepareCheckout,
      {
        cart_id: args.cart_id,
        new_price_id: defaultPrice.id,
        prices: prices.map((p) => ({ price_id: p.id, amount: p.unit_amount! })),
      },
    );
    if (
      !order.stripe_order_id &&
      order.updated_date < Date.now() - 24 * 60 * 60 * 1000
    )
      throw new Error(
        "Pending checkout expired; wait for reconciliation before retrying",
      );
    const customer = await ensureCustomer(ctx, stripe, payer);
    let session: Stripe.Checkout.Session;
    if (order.stripe_order_id)
      session = await stripe.checkout.sessions.retrieve(order.stripe_order_id);
    else {
      const snapshot = order.purchase_snapshot;
      if (!snapshot) throw new Error("Purchase snapshot missing");
      const quantities = new Map<string, number>();
      for (const item of snapshot)
        quantities.set(
          item.stripe_price_id,
          (quantities.get(item.stripe_price_id) ?? 0) + 1,
        );
      const site = process.env.SITE_URL;
      if (!site) throw new Error("SITE_URL is required");
      session = await stripe.checkout.sessions.create(
        {
          customer,
          mode: "payment",
          currency: "jpy",
          payment_method_types: ["card"],
          line_items: [...quantities].map(([price, quantity]) => ({
            price,
            quantity,
          })),
          metadata: {
            order_id: order._id,
            cart_id: cart._id,
            order_number: order.order_number ?? "",
          },
          success_url: site + "/dashboard/members/checkout/success",
          cancel_url: site + "/dashboard/members",
        },
        { idempotencyKey: "annual-checkout:" + order._id },
      );
      await ctx.runMutation(internal.mutations.full_order.updateWithStripeId, {
        order_id: order._id,
        stripe_order_id: session.id,
      });
    }
    if (session.status !== "open" || !session.url)
      throw new Error("Checkout is no longer open");
    return session.url;
  },
});

export const fulfill = internalAction({
  args: { signature: v.string(), payload: v.string() },
  handler: async (
    ctx,
    args,
  ): Promise<{
    success: boolean;
    error?: string;
    invalid_signature?: boolean;
  }> => {
    const stripe = stripeClient();
    let event: Stripe.Event;
    try {
      const secret = process.env.STRIPE_WEBHOOK_SECRET;
      if (!secret) throw new Error("Webhook secret missing");
      event = await stripe.webhooks.constructEventAsync(
        args.payload,
        args.signature,
        secret,
      );
    } catch {
      return {
        success: false,
        error: "Invalid webhook signature",
        invalid_signature: true,
      };
    }
    try {
      if (
        event.type === "checkout.session.completed" ||
        event.type === "checkout.session.expired"
      ) {
        const session = await stripe.checkout.sessions.retrieve(
          event.data.object.id,
        );
        if (session.metadata?.monthly_batch_id) {
          await ctx.runAction(internal.subscriptions.handleEvent, {
            event_json: JSON.stringify(event),
          });
          return { success: true };
        }
        if (session.mode === "payment") {
          if (!session.metadata?.order_id && !session.metadata?.cart_id)
            return { success: true };
          if (session.status === "expired" && session.metadata?.order_id) {
            await ctx.runMutation(internal.annualBilling.expireOrder, {
              order_id: session.metadata.order_id as Id<"full_order">,
              session_id: session.id,
            });
          } else if (
            session.status === "complete" &&
            session.payment_status === "paid"
          ) {
            const customer =
              typeof session.customer === "string"
                ? session.customer
                : session.customer?.id;
            if (
              !customer ||
              session.amount_total === null ||
              session.currency !== "jpy"
            )
              throw new Error("Invalid annual payment");
            const order = await ctx.runMutation(
              internal.annualBilling.fulfillOrder,
              {
                session_id: session.id,
                order_id: session.metadata?.order_id as
                  | Id<"full_order">
                  | undefined,
                cart_id: session.metadata?.cart_id as Id<"cart"> | undefined,
                customer_id: customer,
                amount: session.amount_total,
              },
            );
            if (order) {
              const details = await ctx.runQuery(
                internal.queries.full_order.getOrderByIdInternal,
                { id: order },
              );
              if (details?.order_number)
                await ctx.scheduler.runAfter(
                  0,
                  internal.email.sendPaymentConfirmationEmail,
                  {
                    userId: details.user_id,
                    orderNumber: details.order_number,
                    totalAmount: details.total_amount,
                  },
                );
            }
          }
        } else
          await ctx.runAction(internal.subscriptions.handleEvent, {
            event_json: JSON.stringify(event),
          });
      } else
        await ctx.runAction(internal.subscriptions.handleEvent, {
          event_json: JSON.stringify(event),
        });
      return { success: true };
    } catch {
      // Retryable response; never log the payload, customer data, or Stripe secrets.
      return {
        success: false,
        error: "Stripe event processing failed; retry required",
      };
    }
  },
});

async function requireGlobalAdmin(ctx: ActionCtx) {
  const caller = await ctx.runQuery(internal.billingStore.payer, {});
  if (caller.role !== "admin" && caller.role !== "god")
    throw new Error("Global admin access required");
}

async function provisionCourse(
  ctx: ActionCtx,
  courseId: Id<"course">,
): Promise<void> {
  const course = await ctx.runQuery(api.queries.course.getCourseById, {
    id: courseId,
  });
  if (!course) throw new Error("Course missing");
  const revision = course.provisioning_revision ?? 1;
  const stripe = stripeClient();
  try {
    let product: Stripe.Product | undefined = course.stripe_product_id
      ? await stripe.products.retrieve(course.stripe_product_id)
      : undefined;
    if (!product) {
      // Recover catalog objects even after Stripe's idempotency-key retention window.
      for await (const candidate of stripe.products.list({ limit: 100 })) {
        if (candidate.metadata.course_id === course._id) {
          product = candidate;
          break;
        }
      }
    }
    product ??= await stripe.products.create(
      { name: course.course_name, metadata: { course_id: course._id } },
      { idempotencyKey: "course-product:" + course._id },
    );
    await ctx.runMutation(internal.mutations.course.saveProduct, {
      course_id: course._id,
      product_id: product.id,
    });
    const price = course.pending_price ?? course.price;
    let stripePrice: Stripe.Price | undefined;
    for await (const candidate of stripe.prices.list({
      product: product.id,
      limit: 100,
    })) {
      if (
        candidate.metadata.course_id === course._id &&
        candidate.metadata.revision === String(revision)
      ) {
        if (
          !candidate.active ||
          candidate.unit_amount !== price ||
          candidate.currency !== "jpy" ||
          (isAnnual(course)
            ? !!candidate.recurring
            : candidate.recurring?.interval !== "month" ||
              candidate.recurring.interval_count !== 1)
        )
          throw new Error("Provisioned Stripe price mismatch");
        stripePrice = candidate;
        break;
      }
    }
    stripePrice ??= await stripe.prices.create(
      {
        product: product.id,
        currency: "jpy",
        unit_amount: price,
        ...(isAnnual(course)
          ? {}
          : { recurring: { interval: "month" as const, interval_count: 1 } }),
        metadata: { course_id: course._id, revision: String(revision) },
      },
      { idempotencyKey: "course-price:" + course._id + ":" + revision },
    );
    await stripe.products.update(
      product.id,
      { default_price: stripePrice.id },
      { idempotencyKey: "course-default-price:" + course._id + ":" + revision },
    );
    await ctx.runMutation(internal.mutations.course.updateCourseWithStripe, {
      course_id: course._id,
      stripe_product_id: product.id,
      stripe_price_id: stripePrice.id,
      revision,
      price,
    });
  } catch (error) {
    await ctx.runMutation(internal.mutations.course.provisioningFailed, {
      course_id: course._id,
      revision,
    });
    throw error;
  }
}

export const createProduct = action({
  args: {
    course_name: v.string(),
    price: v.number(),
    billing_model: v.optional(billingModel),
    parent_course_id: v.optional(v.id("course")),
  },
  handler: async (
    ctx,
    args,
  ): Promise<
    | { success: true; course_id: Id<"course"> }
    | { success: false; error: string }
  > => {
    await requireGlobalAdmin(ctx);
    validatePrice(args.price);
    const name = args.course_name.trim();
    if (!name) throw new Error("Course name required");
    try {
      const id = await ctx.runMutation(internal.mutations.course.createCourse, {
        ...args,
        course_name: name,
      });
      await provisionCourse(ctx, id);
      return { success: true, course_id: id };
    } catch {
      return {
        success: false,
        error:
          "Course creation failed; retry the same request or inspect billing issues",
      };
    }
  },
});

export const updateCoursePricing = action({
  args: { course_id: v.id("course"), price: v.number() },
  handler: async (
    ctx,
    args,
  ): Promise<{ success: true; course_id: Id<"course"> }> => {
    await requireGlobalAdmin(ctx);
    validatePrice(args.price);
    const course = await ctx.runQuery(api.queries.course.getCourseById, {
      id: args.course_id,
    });
    if (course && !course.stripe_product_id && course.stripe_price_id) {
      const price = await stripeClient().prices.retrieve(
        course.stripe_price_id,
      );
      const productId =
        typeof price.product === "string" ? price.product : price.product.id;
      await ctx.runMutation(internal.mutations.course.saveProduct, {
        course_id: course._id,
        product_id: productId,
      });
    }
    await ctx.runMutation(internal.mutations.course.beginPriceUpdate, args);
    await provisionCourse(ctx, args.course_id);
    return { success: true, course_id: args.course_id };
  },
});

export const retryCourseProvisioning = action({
  args: { course_id: v.id("course") },
  handler: async (ctx, args): Promise<{ success: true }> => {
    await requireGlobalAdmin(ctx);
    await provisionCourse(ctx, args.course_id);
    return { success: true };
  },
});

export const updateCourseDetails = action({
  args: { course_id: v.id("course"), course_name: v.string() },
  handler: async (ctx, args): Promise<{ success: true }> => {
    await requireGlobalAdmin(ctx);
    const course = await ctx.runMutation(api.mutations.course.editCourse, {
      id: args.course_id,
      course_name: args.course_name,
    });
    if (typeof course === "string" || !course)
      throw new Error("Course unavailable");
    if (course.stripe_product_id)
      await stripeClient().products.update(course.stripe_product_id, {
        name: course.course_name,
      });
    return { success: true };
  },
});

/*
updateMemberInfo action does the following:
1. Verifies user authentication
2. Gets user information from database
3. Updates user information in database if values are provided
4. If user has stripe_id, updates customer information in Stripe
*/
export const updateMemberInfo = action({
  args: {
    userId: v.id("userTable"),
    first_name: v.optional(v.string()),
    last_name: v.optional(v.string()),
    email: v.optional(v.string()),
  },
  handler: async (ctx, { userId, first_name, last_name, email }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Get current user information
    const user = await ctx.runQuery(api.queries.users.getUserById, {
      id: userId,
    });
    if (!user) {
      throw new Error("User not found");
    }

    // Verify the user is updating their own information
    if (user.auth_id !== identity.subject) {
      throw new Error("Unauthorized: You can only update your own information");
    }

    // Update user information in database
    await ctx.runMutation(internal.mutations.users.updateUserInfo, {
      userId,
      first_name,
      last_name,
      email,
    });

    // If user has a stripe_id, update Stripe customer
    if (user.stripe_id) {
      const stripe = stripeClient();

      const updateData: {
        name?: string;
        email?: string;
      } = {};

      // Build name from first_name and last_name if provided
      if (first_name !== undefined || last_name !== undefined) {
        const updatedFirstName = first_name ?? user.first_name;
        const updatedLastName = last_name ?? user.last_name;
        updateData.name = `${updatedFirstName} ${updatedLastName}`;
      }

      // Update email if provided
      if (email !== undefined) {
        updateData.email = email;
      }

      // Only update Stripe if there's something to update
      if (Object.keys(updateData).length > 0) {
        await stripe.customers.update(user.stripe_id, updateData);
      }
    }

    return { success: true };
  },
});

const ALLOWED_ADMIN_ROLES = ["admin", "org_admin", "god"] as const;

/**
 * Admin action to update any user's information.
 * Requires caller to have admin, org_admin, or god role.
 */
export const adminUpdateUserInfo = action({
  args: {
    userId: v.id("userTable"),
    first_name: v.optional(v.string()),
    last_name: v.optional(v.string()),
    email: v.optional(v.string()),
    status: v.optional(v.union(v.literal("active"), v.literal("inactive"))),
  },
  handler: async (ctx, { userId, first_name, last_name, email, status }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Get caller's role to verify admin access
    const caller = await ctx.runQuery(api.queries.users.getUserRoleByAuthId, {
      userId: identity.subject,
    });
    if (
      !ALLOWED_ADMIN_ROLES.includes(
        caller.role as (typeof ALLOWED_ADMIN_ROLES)[number],
      )
    ) {
      throw new Error("Unauthorized: Admin access required");
    }

    // Get target user information
    const user = await ctx.runQuery(api.queries.users.getUserById, {
      id: userId,
    });
    if (!user) {
      throw new Error("User not found");
    }

    // Update user information in database
    await ctx.runMutation(internal.mutations.users.updateUserInfo, {
      userId,
      first_name,
      last_name,
      email,
      status,
    });

    // If user has a stripe_id, update Stripe customer (name/email only)
    if (
      user.stripe_id &&
      (first_name !== undefined ||
        last_name !== undefined ||
        email !== undefined)
    ) {
      const stripe = stripeClient();

      const updateData: {
        name?: string;
        email?: string;
      } = {};

      if (first_name !== undefined || last_name !== undefined) {
        const updatedFirstName = first_name ?? user.first_name;
        const updatedLastName = last_name ?? user.last_name;
        updateData.name = `${updatedFirstName} ${updatedLastName}`;
      }
      if (email !== undefined) {
        updateData.email = email;
      }

      if (Object.keys(updateData).length > 0) {
        await stripe.customers.update(user.stripe_id, updateData);
      }
    }

    return { success: true };
  },
});
