import { internalMutation, mutation } from "../_generated/server";
import { ConvexError, v } from "convex/values";

export const createUser = mutation({
  args: {
    auth_id: v.optional(v.string()),
    first_name: v.string(),
    last_name: v.string(),
    email: v.string(),
    role: v.optional(v.union(v.literal("user"), v.literal("admin"), v.literal("org_admin"), v.literal("god"))),
    org_id: v.optional(v.id("organization")),
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
      org_id: args.org_id,
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
    status: v.optional(v.union(v.literal("active"), v.literal("inactive"))),
  },
  handler: async (ctx, args) => {
    const updateData: {
      first_name?: string;
      last_name?: string;
      email?: string;
      status?: "active" | "inactive";
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
    if (args.status !== undefined) {
      updateData.status = args.status;
    }

    await ctx.db.patch(args.userId, updateData);
  },
});

/**
 * One-time migration to assign SmartEd org_id to all users with "user" role.
 * Run this from the Convex dashboard after deploying the schema changes.
 */
export const migrateUsersToSmartEdOrg = mutation({
  args: {},
  handler: async (ctx) => {
    // Find the SmartEd organization
    const smartEdOrg = await ctx.db
      .query("organization")
      .withIndex("by_organization_name", (q) => q.eq("organization_name", "SmartEd"))
      .first();

    if (!smartEdOrg) {
      throw new ConvexError("SmartEd organization not found. Please create it first.");
    }

    // Get all users with role "user"
    const users = await ctx.db
      .query("userTable")
      .withIndex("users_by_role", (q) => q.eq("role", "user"))
      .collect();

    let updatedCount = 0;
    for (const user of users) {
      // Only update users that don't already have an org_id
      if (!user.org_id) {
        await ctx.db.patch(user._id, {
          org_id: smartEdOrg._id,
          updated_at: Date.now(),
        });
        updatedCount++;
      }
    }

    return {
      success: true,
      message: `Migration complete. Updated ${updatedCount} users with SmartEd org_id.`,
      smartEdOrgId: smartEdOrg._id,
    };
  },
});

/**
 * Update a user's role and org_id. Useful for promoting users to org_admin.
 */
export const updateUserRole = mutation({
  args: {
    userId: v.id("userTable"),
    role: v.union(v.literal("user"), v.literal("admin"), v.literal("org_admin"), v.literal("god")),
    org_id: v.optional(v.id("organization")),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new ConvexError("User not found");
    }

    await ctx.db.patch(args.userId, {
      role: args.role,
      org_id: args.org_id,
      updated_at: Date.now(),
    });

    return {
      success: true,
      message: `User ${user.email} updated to role ${args.role}`,
    };
  },
});


