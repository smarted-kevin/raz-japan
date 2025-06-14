import { mutation } from "../_generated/server";
import { v } from "convex/values";

export const createOrganization = mutation({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    const organization = await ctx.db
      .query("organization")
      .withIndex("by_organization_name", (q) => q.eq("organization_name", args.name))
      .first();

    if (organization) return "Organization already exists, choose a different name."
    
    const new_organization = await ctx.db
      .insert(
        "organization",
        {
          organization_name: args.name,
          status: "active"
        }
      )
      return new_organization;
  }
});

export const editOrganization = mutation({
  args: {
    id: v.id("organization"),
    org_name: v.optional(v.string()),
    status: v.optional(v.union(v.literal("active"), v.literal("inactive")))
  },
  handler: async (ctx, args) => {
    const organization = await ctx.db.get(args.id);
    if (!organization) return "No organization found."

    const updated_organization = await ctx.db
      .patch(
        args.id,
        {
          organization_name: args.org_name ?? organization.organization_name,
          status: args.status ?? organization.status
        }
      )
      return updated_organization;
  }
});