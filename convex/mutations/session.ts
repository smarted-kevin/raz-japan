import { internalMutation, mutation } from "../_generated/server";
import { v } from "convex/values";

export const createSession = mutation({
  args: {
    sessionId: v.string(), 
    userId: v.id("userTable"),
    role: v.union(v.literal("user"), v.literal("admin"), v.literal("god")),
    expiresAt: v.number()
  },
  handler: async (ctx, args) => {
    const sessionId = await ctx.db.insert(
      "session", 
      { 
        user_id: args.userId,
        role: args.role,
        sessionId: args.sessionId,
        expires_at: args.expiresAt,
      })

    return sessionId;
  }
});

export const deleteSessionById = mutation({
  args: { sessionId: v.id("session") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.sessionId);
  }
});

export const updateSessionRole = mutation({
  args: { 
    sessionId: v.string(), 
    role: v.union(v.literal("user"), v.literal("admin"), v.literal("god")),
    expires: v.number() 
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("session")
      .withIndex("by_session_id", (q) => q.eq("sessionId", args.sessionId))
      .unique();

    if (!session) {
      console.warn("Session not found");
      return;
    }

    await ctx.db.patch(session._id, { role: args.role, expires_at: args.expires });
  }
});

export const deleteSessionBySessionId = mutation({
  args: { sessionId: v.string() },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("session")
      .withIndex("by_session_id", (q) => q.eq("sessionId", args.sessionId))
      .unique();

    if (!session) {
      console.warn("Session not found");
      return;
    }
  }
});

export const deleteExpiredSessions = internalMutation({
  handler: async (ctx) => {
    const now = Date.now();
    const expiredTokens = await ctx.db
      .query("session")
      .filter((q) => q.lt(q.field("expires_at"), now))
      .collect();
    
    for (const token of expiredTokens) {
      await ctx.db.delete(token._id);
    }
  }
});