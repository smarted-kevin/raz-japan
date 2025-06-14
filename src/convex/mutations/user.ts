import { mutation } from "../_generated/server";
import { v } from "convex/values";

export const createUser = mutation({
  args: {
    password: v.string(),
    first_name: v.string(),
    last_name: v.string(),
    email: v.string(),
    pwSalt: v.string(),
    role: v.union(v.literal("user"), v.literal("admin")),
    created_at: v.number(), // DateTime stored as timestamp
    updated_at: v.number(),
    status: v.union(v.literal("active"), v.literal("inactive")),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.insert(
      "user",
    {
      password: args.password,
      first_name: args.first_name,
      last_name: args.last_name,
      email: args.email,
      pwSalt: args.pwSalt,
      created_at: args.created_at,
      updated_at: args.updated_at,
      status: args.status ?? "active",
      role: args.role ?? "user",
    })

    return user;
  }
})