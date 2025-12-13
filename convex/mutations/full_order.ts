import { internalMutation, mutation } from "../_generated/server";
import { v } from "convex/values";

export const createFullOrder = mutation({
  args: { 
    user_id: v.id("userTable"),
    total_amount: v.number(),
    promotion_id: v.optional(v.id("promotion_code")),
    updated_date: v.number(),
    stripe_order_id: v.optional(v.string()),
    status: v.union(v.literal("created"), v.literal("pending"), v.literal("fulfilled"), v.literal("canceled"))
  },
  handler: async (ctx, args) => {
    const order = await ctx.db
      .insert(
        "full_order",
        {
          user_id: args.user_id,
          total_amount: args.total_amount,
          promotion_id: args.promotion_id ?? undefined,
          updated_date: args.updated_date ?? Date.now(),
          stripe_order_id: args.stripe_order_id ?? "",
          status: "created"
        }
      )
    return order;
  }
});

export const updateWithStripeId = internalMutation({
  args: { 
    order_id: v.id("full_order"),
    stripe_order_id: v.string(), 
  },
  handler: async (ctx, args) => {

    const updated_order = await ctx.db
      .patch(
        args.order_id,
        {
          stripe_order_id: args.stripe_order_id,
          status: "pending"
        }
      )
    
    return updated_order;

  }
});

export const updateStatus = internalMutation({
  args: { 
    stripe_id: v.string(),
    status: v.union(v.literal("created"), v.literal("pending"), v.literal("fulfilled"), v.literal("canceled"))
  },
  handler: async (ctx, args) => {
    const order = await ctx.db
      .query("full_order")
      .withIndex("by_stripe_order_id", (q) => q.eq("stripe_order_id", args.stripe_id))
      .first();

    if (!order) return "Order not found.";
    await ctx.db.patch(order._id, { status: args.status });
    
    return order._id;
  }
});

export const updateDateOrderPrice = mutation({
  args: { order_id: v.id("full_order") },
  handler: async (ctx, args) => {
    const students = await ctx.db
      .query("student_order")
      .withIndex("by_order_id", (q) => q.eq("order_id", args.order_id))
      .collect();

    const order_total = students.reduce((total, student) => {
      return total += student.amount;
    }, 0); 
    
    const updated_order = await ctx.db
      .patch(
        args.order_id,
        {
          total_amount: order_total ?? 0,
          updated_date: Date.now()
        }
      );
    const return_order = await ctx.db.get(args.order_id);

    return return_order;
  }
})
