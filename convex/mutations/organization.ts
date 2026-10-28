import { ConvexError, v } from "convex/values";
import { adminMutation } from "../lib/auth";

export const createOrganization = adminMutation({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    if (ctx.user.role !== "god") throw new ConvexError({ code: "FORBIDDEN" });
    const name = args.name.trim();
    if (!name) throw new ConvexError({ code: "NAME_REQUIRED" });
    const organization = await ctx.db
      .query("organization")
      .withIndex("by_organization_name", (q) => q.eq("organization_name", name))
      .first();

    if (organization) throw new ConvexError({ code: "DUPLICATE_NAME" });

    const new_organization = await ctx.db.insert("organization", {
      organization_name: name,
      status: "active",
    });
    return new_organization;
  },
});

export const editOrganization = adminMutation({
  args: {
    id: v.id("organization"),
    org_name: v.optional(v.string()),
    status: v.optional(v.union(v.literal("active"), v.literal("inactive"))),
  },
  handler: async (ctx, args) => {
    if (ctx.user.role !== "god") throw new ConvexError({ code: "FORBIDDEN" });
    const organization = await ctx.db.get(args.id);
    if (!organization) throw new ConvexError({ code: "NOT_FOUND" });

    const name = args.org_name?.trim() ?? organization.organization_name;
    if (!name) throw new ConvexError({ code: "NAME_REQUIRED" });
    const matches = await ctx.db
      .query("organization")
      .withIndex("by_organization_name", (q) => q.eq("organization_name", name))
      .collect();
    if (matches.some((match) => match._id !== args.id)) {
      throw new ConvexError({ code: "DUPLICATE_NAME" });
    }

    const updated_organization = await ctx.db.patch(args.id, {
      organization_name: name,
      status: args.status ?? organization.status,
    });
    return updated_organization;
  },
});
