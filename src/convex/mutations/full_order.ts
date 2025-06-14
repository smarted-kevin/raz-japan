import { mutation } from "../_generated/server";
import { v } from "convex/values";

export const createFullOrder = mutation({
  args: { 
    user_id: v.id("user"),
    total_amount: v.number(),
    promotion_id: v.optional(v.id("promotion_code")),
    updated_date: v.number()
  },
  handler: async (ctx, args) => {
    const order = await ctx.db
      .insert(
        "full_order",
        {
          user_id: args.user_id,
          total_amount: args.total_amount,
          promotion_id: args.promotion_id ?? undefined,
          updated_date: args.updated_date
        }
      )
    return order;
  }
});
