import { mutation } from "../_generated/server";
import { v } from "convex/values";

export const createStudentOrder = mutation({
  args: {
    amount: v.number(),
    order_id: v.id("full_order"),
    order_type: v.union(v.literal("new"), v.literal("renewal"), v.literal("reactivation")),
    student_id: v.id("student"),
    created_date: v.number(),
    updated_on: v.number()
  },
  handler: async (ctx, args) => {
    const student_order = await ctx.db
      .insert(
        "student_order",
        {
          amount: args.amount,
          order_id: args.order_id,
          order_type: args.order_type,
          student_id: args.student_id,
          created_date: Date.now(),
          updated_on: Date.now()
        }
      )

      return student_order;
  }
})