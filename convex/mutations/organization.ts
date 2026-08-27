import { v } from "convex/values";
import { adminMutation, requireOrganizationAccess } from "../lib/auth";

export const createOrganization = adminMutation({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    if (ctx.user.role === "org_admin") return "Global admin access required.";
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

export const editOrganization = adminMutation({
  args: {
    id: v.id("organization"),
    org_name: v.optional(v.string()),
    status: v.optional(v.union(v.literal("active"), v.literal("inactive")))
  },
  handler: async (ctx, args) => {
    requireOrganizationAccess(ctx.user, args.id);
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
