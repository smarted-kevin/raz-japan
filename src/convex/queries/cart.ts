import { query } from "../_generated/server";
import { v } from "convex/values";

export const getCartByUserId = query({
  args: { id: v.id("user") },
  handler: async (ctx, args) => {
    const cart = await ctx.db
      .query("cart")
      .withIndex("by_user_id", (q) => q.eq("user_id", args.id))
      .first();
    if (cart) {

      return {
        user_id: cart?.user_id,
        updated_on: cart?.updated_on,
        new_students: cart?.new_students
      };
    } else {
      return {};
    }
  }
})