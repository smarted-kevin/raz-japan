import { internalMutation, mutation } from "../_generated/server";
import { ConvexError, v } from "convex/values";

export const createUser = mutation({
  args: {
    auth_id: v.optional(v.string()),
    first_name: v.string(),
    last_name: v.string(),
    email: v.string(),
    role: v.optional(v.union(v.literal("user"), v.literal("admin"), v.literal("god"))),
    updated_at: v.number(),
    status: v.union(v.literal("active"), v.literal("inactive")),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.insert(
      "userTable",
    {
      auth_id: args.auth_id ?? "",
      first_name: args.first_name,
      last_name: args.last_name,
      email: args.email,
      updated_at: args.updated_at,
      status: args.status ?? "active",
      role: args.role ?? "user",
    })

    return user;
  }
});

export const updateStripeId = internalMutation({
  args: {
    userId: v.id("userTable"),
    stripe_id: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      stripe_id: args.stripe_id,
    });
  },
});

export const updateUserInfo = internalMutation({
  args: {
    userId: v.id("userTable"),
    first_name: v.optional(v.string()),
    last_name: v.optional(v.string()),
    email: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const updateData: {
      first_name?: string;
      last_name?: string;
      email?: string;
      updated_at: number;
    } = {
      updated_at: Date.now(),
    };

    if (args.first_name !== undefined) {
      updateData.first_name = args.first_name;
    }
    if (args.last_name !== undefined) {
      updateData.last_name = args.last_name;
    }
    if (args.email !== undefined) {
      updateData.email = args.email;
    }

    await ctx.db.patch(args.userId, updateData);
  },
});


