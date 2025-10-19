import { query } from "../_generated/server";
import { v } from "convex/values";

export const getStudentOrdersByOrderId = query({
  args: { order_id: v.id("full_order") },
  handler: async (ctx, args) => {
    const full_order = await ctx.db.get(args.order_id);

    if (!full_order) return "Order not found.";
    
    const student_orders = await ctx.db
      .query("student_order")
      .withIndex("by_order_id", (q) => q.eq("order_id", args.order_id))
      .collect();

    return student_orders;
  }
});

export const getStudentOrderById = query({
  args: { student_order_id: v.id("student_order") },
  handler: async (ctx, args) => {
    const student_order = await ctx.db.get(args.student_order_id);

    if (!student_order) return "No student order found.";

    return student_order;
  }
})