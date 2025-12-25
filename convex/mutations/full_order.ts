import { internalMutation, mutation } from "../_generated/server";
import { v } from "convex/values";
import type { MutationCtx } from "../_generated/server";

/**
 * Generates the next sequential order number in the format RAZ-XXXX
 * where XXXX is a zero-padded 4-digit number.
 * Uses an atomic counter table to prevent race conditions.
 * This function atomically reads, increments, and updates the counter within the same mutation.
 */
async function generateOrderNumber(ctx: MutationCtx): Promise<string> {
  const COUNTER_NAME = "order_number";
  
  // Try to get existing counter
  let counter = await ctx.db
    .query("order_counter")
    .withIndex("by_counter_name", (q) => q.eq("counter_name", COUNTER_NAME))
    .first();
  
  
  if (!counter) {
    // Initialize counter if it doesn't exist
    // Check existing orders to find the max number for migration
    const orders = await ctx.db.query("full_order").collect();
    let maxNumber = 0;
    
    for (const order of orders) {
      if (order.order_number) {
        const match = /^RAZ-(\d+)$/.exec(order.order_number);
        if (match) {
          const num = parseInt(match[1], 10) ?? 0;
          if (num > maxNumber) {
            maxNumber = num;
          }
        }
      }
    }
    
    // Initialize counter with the max existing order number
    // (or 0 if no orders exist, so first order will be RAZ-0001)
    const initialValue = maxNumber;
    
    // Try to insert the counter. Since mutations are atomic, if another
    // mutation already created it concurrently, we'll handle it below.
    try {
      await ctx.db.insert("order_counter", {
        counter_name: COUNTER_NAME,
        value: initialValue,
      });
    } catch {
      // Counter was created by another concurrent mutation, fetch it
      counter = await ctx.db
        .query("order_counter")
        .withIndex("by_counter_name", (q) => q.eq("counter_name", COUNTER_NAME))
        .first();
      
      if (!counter) {
        throw new Error("Failed to initialize or retrieve order counter");
      }
    }
    
    // Re-fetch counter to ensure we have the latest value
    counter = await ctx.db
      .query("order_counter")
      .withIndex("by_counter_name", (q) => q.eq("counter_name", COUNTER_NAME))
      .first();
    
    if (!counter) {
      throw new Error("Failed to retrieve order counter after initialization");
    }
  }
  
  // Atomically increment the counter and use the new value
  // This ensures no two mutations get the same number
  const nextValue = counter.value + 1;
  await ctx.db.patch(counter._id, {
    value: nextValue,
  });
  
  return `RAZ-${nextValue.toString().padStart(4, "0")}`;
}

export const createFullOrder = mutation({
  args: { 
    user_id: v.id("userTable"),
    total_amount: v.number(),
    promotion_id: v.optional(v.id("promotion_code")),
    updated_date: v.number(),
    stripe_order_id: v.optional(v.string()),
    status: v.union(v.literal("created"), v.literal("pending"), v.literal("fulfilled"), v.literal("canceled")),
    order_number: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    // Generate order number if not provided
    const orderNumber = args.order_number ?? await generateOrderNumber(ctx);
    
    const order = await ctx.db
      .insert(
        "full_order",
        {
          user_id: args.user_id,
          total_amount: args.total_amount,
          promotion_id: args.promotion_id ?? undefined,
          updated_date: args.updated_date ?? Date.now(),
          stripe_order_id: args.stripe_order_id ?? "",
          status: "created",
          order_number: orderNumber
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
