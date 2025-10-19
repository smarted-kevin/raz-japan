import { query } from "../_generated/server";
import { v } from "convex/values";

export const getSessionById = query({
  args: { sessionId: v.string() },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("session")
      .withIndex("by_session_id", (q) => q.eq("sessionId", args.sessionId))
      .first();
    return session ? {
      user_id: session?.user_id,
      role: session?.role
    } : null;
  }
})