import { query } from "../_generated/server";
import { v } from "convex/values";

export const getAllOrders = query({ 
  args: {},
  handler: async (ctx) => {
    const orders = await ctx.db.query("full_order").collect();
    return orders;
  }
});

export const getOrderById = query({
  args: { id: v.id("full_order") },
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.id);
    return order;
  }
});

export const getOrderByStripeId = query({
  args: { stripe_id: v.string() },
  handler: async (ctx, args) => {
    const order = await ctx.db
      .query("full_order")
      .withIndex("by_stripe_order_id", (q) => q.eq("stripe_order_id", args.stripe_id))
      .first();
    return order;
  }
});