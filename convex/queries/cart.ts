import { internalQuery, query } from "../_generated/server";
import { v } from "convex/values";

export const getCartById = internalQuery({
  args: { id: v.id("cart") },
  handler: async (ctx, args) => {
    const cart = ctx.db.get(args.id);

    return cart;
  }
});

export const userCartExists = query({
  args: { user_id: v.id("userTable") },
  handler: async (ctx, args) => {
    const cart = await ctx.db
      .query("cart")
      .withIndex("by_user_id", (q) => q.eq("user_id", args.user_id))
      .first();
    return cart != null ? true : false;
  }
});

export const getCartByUserId = query({
  args: { id: v.id("userTable") },
  handler: async (ctx, args) => {
    const cart = await ctx.db
      .query("cart")
      .withIndex("by_user_id", (q) => q.eq("user_id", args.id))
      .first();
    if (cart?._id && cart?.user_id) {
      
      return {
        cart_id: cart._id,
        user_id: cart.user_id,
        updated_on: cart.updated_on,
        new_students: cart.new_students ?? 0,
        renewal_students: cart.renewal_students ?? []
      };
    } else {
      return null;
    }
  }
});
