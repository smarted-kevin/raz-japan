import { internalMutation, mutation } from "../_generated/server";
import { v } from "convex/values";

const WINDOW_MS = 60 * 60 * 1000;
const IP_LIMIT = 5;
const EMAIL_LIMIT = 3;

export const consumeContactRateLimit = mutation({
  args: {
    secret: v.string(),
    ip_key: v.string(),
    email_key: v.string(),
  },
  handler: async (ctx, args) => {
    const expectedSecret = process.env.CONTACT_RATE_LIMIT_SECRET;
    if (!expectedSecret || args.secret !== expectedSecret) {
      throw new Error("Not authorized");
    }

    const now = Date.now();
    const limits = [
      { key: `ip:${args.ip_key}`, limit: IP_LIMIT },
      { key: `email:${args.email_key}`, limit: EMAIL_LIMIT },
    ];

    const records = await Promise.all(
      limits.map(async ({ key, limit }) => ({
        key,
        limit,
        record: await ctx.db
          .query("contact_rate_limit")
          .withIndex("by_key", (query) => query.eq("key", key))
          .unique(),
      })),
    );

    const blockedUntil = records
      .filter(({ record, limit }) =>
        Boolean(record && now - record.window_start < WINDOW_MS && record.count >= limit),
      )
      .map(({ record }) => (record?.window_start ?? now) + WINDOW_MS);

    if (blockedUntil.length > 0) {
      return {
        ok: false as const,
        retry_after_seconds: Math.max(
          1,
          Math.ceil((Math.max(...blockedUntil) - now) / 1000),
        ),
      };
    }

    for (const { key, record } of records) {
      if (!record) {
        await ctx.db.insert("contact_rate_limit", {
          key,
          window_start: now,
          count: 1,
        });
      } else if (now - record.window_start >= WINDOW_MS) {
        await ctx.db.patch(record._id, { window_start: now, count: 1 });
      } else {
        await ctx.db.patch(record._id, { count: record.count + 1 });
      }
    }

    return { ok: true as const, retry_after_seconds: 0 };
  },
});

export const cleanupContactRateLimits = internalMutation({
  args: {},
  handler: async (ctx) => {
    const expired = await ctx.db
      .query("contact_rate_limit")
      .withIndex("by_window_start", (query) =>
        query.lt("window_start", Date.now() - WINDOW_MS),
      )
      .take(500);

    await Promise.all(expired.map((record) => ctx.db.delete(record._id)));
    return expired.length;
  },
});
