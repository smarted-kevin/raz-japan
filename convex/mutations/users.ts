import { internal } from "../_generated/api";
import { mutation } from "../_generated/server";
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


