import { internalMutation } from "../_generated/server";
import { v } from "convex/values";
import { adminMutation } from "../lib/auth";
import { billingModel, validatePrice } from "../lib/billing";

export const createCourse = internalMutation({
  args: {
    course_name: v.string(),
    price: v.number(),
    billing_model: v.optional(billingModel),
    parent_course_id: v.optional(v.id("course")),
  },
  handler: async (ctx, args) => {
    validatePrice(args.price);
    if ((args.billing_model ?? "annual_purchase") === "monthly_subscription") {
      const parent = args.parent_course_id
        ? await ctx.db.get(args.parent_course_id)
        : null;
      if (
        !parent ||
        (parent.billing_model ?? "annual_purchase") !== "annual_purchase"
      )
        throw new Error("A monthly add-on requires an annual parent course");
    } else if (args.parent_course_id)
      throw new Error("Annual courses cannot be add-ons");
    const course = await ctx.db
      .query("course")
      .withIndex("by_course_name", (q) => q.eq("course_name", args.course_name))
      .first();

    if (course) {
      if (
        course.provisioning_state !== "ready" &&
        course.pending_price === undefined &&
        course.price === args.price &&
        course.parent_course_id === args.parent_course_id &&
        course.billing_model === (args.billing_model ?? "annual_purchase")
      ) {
        await ctx.db.patch(course._id, {
          provisioning_revision: course.provisioning_revision ?? 1,
          provisioning_state: "pending",
        });
        return course._id;
      }
      throw new Error("Course with that name already exists");
    }

    const new_course = await ctx.db.insert("course", {
      course_name: args.course_name,
      price: args.price,
      status: "active",
      billing_model: args.billing_model ?? "annual_purchase",
      parent_course_id: args.parent_course_id,
      provisioning_state: "pending",
      provisioning_revision: 1,
    });

    return new_course;
  },
});

export const updateCourseWithStripe = internalMutation({
  args: {
    course_id: v.id("course"),
    stripe_product_id: v.string(),
    stripe_price_id: v.string(),
    revision: v.number(),
    price: v.number(),
  },
  handler: async (ctx, args) => {
    const course = await ctx.db.get(args.course_id);
    if (!course) return "No course found.";
    if (course.provisioning_revision !== args.revision)
      throw new Error("Stale Stripe provisioning result");

    await ctx.db.patch(args.course_id, {
      stripe_price_id: args.stripe_price_id,
      price: args.price,
      pending_price: undefined,
      provisioning_state: "ready",
      provisioning_error: undefined,
      stripe_product_id: args.stripe_product_id,
    });
    const updated_course = await ctx.db.get(args.course_id);

    return {
      course_id: updated_course?._id,
    };
  },
});

export const editCourse = adminMutation({
  args: {
    id: v.id("course"),
    course_name: v.optional(v.string()),
    price: v.optional(v.number()),
    status: v.optional(v.union(v.literal("active"), v.literal("inactive"))),
  },
  handler: async (ctx, args) => {
    if (ctx.user.role === "org_admin") return "Global admin access required.";
    const course = await ctx.db.get(args.id);
    if (!course) return "No course found.";
    if (args.course_name !== undefined) {
      const name = args.course_name.trim();
      if (!name || name.length > 150) throw new Error("Invalid course name");
      const duplicate = await ctx.db
        .query("course")
        .withIndex("by_course_name", (q) => q.eq("course_name", name))
        .first();
      if (duplicate && duplicate._id !== course._id)
        throw new Error("Course name already exists");
      args.course_name = name;
    }
    if (args.price !== undefined && args.price !== course.price)
      throw new Error(
        "Use stripe.updateCoursePricing to update billing prices",
      );

    await ctx.db.patch(args.id, {
      course_name: args.course_name ?? course.course_name,
      price: args.price ?? course.price,
      status: args.status ?? course.status,
    });

    const updated_course = await ctx.db.get(args.id);
    return updated_course;
  },
});

export const setAddonParent = adminMutation({
  args: { course_id: v.id("course"), parent_course_id: v.id("course") },
  handler: async (ctx, args) => {
    if (ctx.user.role === "org_admin")
      throw new Error("Global admin access required");
    const course = await ctx.db.get(args.course_id);
    const parent = await ctx.db.get(args.parent_course_id);
    if (
      !course ||
      course.billing_model !== "monthly_subscription" ||
      !parent ||
      (parent.billing_model ?? "annual_purchase") !== "annual_purchase"
    )
      throw new Error("Invalid add-on parent");
    if (course.parent_course_id && course.parent_course_id !== parent._id)
      throw new Error("Parent course is immutable");
    const subscription = await ctx.db
      .query("subscription")
      .withIndex("by_course", (q) => q.eq("course_id", course._id))
      .first();
    const attempt = await ctx.db
      .query("monthly_checkout")
      .withIndex("by_course", (q) => q.eq("course_id", course._id))
      .first();
    if (subscription || attempt)
      throw new Error("Existing billing records require a reviewed migration");
    await ctx.db.patch(course._id, { parent_course_id: parent._id });
  },
});

export const beginPriceUpdate = internalMutation({
  args: { course_id: v.id("course"), price: v.number() },
  handler: async (ctx, args) => {
    validatePrice(args.price);
    const course = await ctx.db.get(args.course_id);
    if (!course?.stripe_product_id)
      throw new Error("Course product unavailable");
    if (course.pending_price !== undefined) {
      if (course.pending_price !== args.price)
        throw new Error("Another price update is pending");
      return course;
    }
    if (course.provisioning_state && course.provisioning_state !== "ready")
      throw new Error("Complete course provisioning before changing its price");
    await ctx.db.patch(course._id, {
      pending_price: args.price,
      provisioning_revision: (course.provisioning_revision ?? 0) + 1,
      provisioning_state: "pending",
    });
    return (await ctx.db.get(course._id))!;
  },
});

export const provisioningFailed = internalMutation({
  args: { course_id: v.id("course"), revision: v.number() },
  handler: async (ctx, args) => {
    const course = await ctx.db.get(args.course_id);
    if (course?.provisioning_revision === args.revision)
      await ctx.db.patch(course._id, {
        provisioning_state: "failed",
        provisioning_error:
          "Stripe provisioning failed; retry the same request",
      });
  },
});

export const saveProduct = internalMutation({
  args: { course_id: v.id("course"), product_id: v.string() },
  handler: async (ctx, args) => {
    const course = await ctx.db.get(args.course_id);
    if (
      !course ||
      (course.stripe_product_id && course.stripe_product_id !== args.product_id)
    )
      throw new Error("Course product mismatch");
    await ctx.db.patch(args.course_id, { stripe_product_id: args.product_id });
  },
});
