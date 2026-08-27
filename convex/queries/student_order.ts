import { v } from "convex/values";
import { authedQuery, requireUserAccess } from "../lib/auth";

export const getStudentOrdersByOrderId = authedQuery({
  args: { order_id: v.id("full_order") },
  handler: async (ctx, args) => {
    const full_order = await ctx.db.get(args.order_id);

    if (!full_order) return "Order not found.";
    const owner = await ctx.db.get(full_order.user_id);
    if (!owner) return "Order owner not found.";
    requireUserAccess(ctx.user, owner);
    
    const student_orders = await ctx.db
      .query("student_order")
      .withIndex("by_order_id", (q) => q.eq("order_id", args.order_id))
      .collect();

    return student_orders;
  }
});

export const getStudentOrderById = authedQuery({
  args: { student_order_id: v.id("student_order") },
  handler: async (ctx, args) => {
    const student_order = await ctx.db.get(args.student_order_id);

    if (!student_order) return "No student order found.";
    const order = await ctx.db.get(student_order.order_id);
    if (!order) return "Order not found.";
    const owner = await ctx.db.get(order.user_id);
    if (!owner) return "Order owner not found.";
    requireUserAccess(ctx.user, owner);

    return student_order;
  }
})
