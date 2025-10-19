import { mutation } from "../_generated/server";
import { v } from "convex/values";

export const createCart = mutation({
  args: { 
    user_id: v.id("userTable"),
    new_students: v.optional(v.number()),
    renewal_students: v.optional(v.array(v.id("student")))
  },
  handler: async (ctx,args) => {
    const cart = await ctx.db
      .query("cart")
      .withIndex("by_user_id", (q) => q.eq("user_id", args.user_id))
      .first();
    
    if (cart) return {error: "Cart for this user already exists."};

    const new_cart = await ctx.db.insert(
      "cart",
      {
        user_id: args.user_id,
        created_date: Date.now(),
        updated_on: Date.now(),
        new_students: args.new_students ?? 0,
        renewal_students: args.renewal_students ?? []
      }
    )

    return {
      cart_id: new_cart
    };
  }
});

export const updateCart = mutation({
  args: { 
    cart_id: v.id("cart"),
    user_id: v.id("userTable"),
    new_students: v.optional(v.number()),
    renewal_students: v.optional(v.array(v.id("student")))
  },
  handler: async (ctx, args) => {
    const cart = await ctx.db
      .query("cart")
      .withIndex("by_user_id", (q) => q.eq("user_id", args.user_id))
      .first();

    if (cart?._id != args.cart_id) return "Cart ids do not match";

    const updated_cart = await ctx.db
      .patch(args.cart_id,
        {
          new_students: args.new_students ?? cart.new_students,
          renewal_students: args.renewal_students ?? cart.renewal_students
        }
      )
    return updated_cart;
  }
})