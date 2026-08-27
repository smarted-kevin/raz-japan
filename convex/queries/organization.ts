import { v } from "convex/values";
import { adminQuery, requireOrganizationAccess } from "../lib/auth";

export const getAllOrganizations = adminQuery(async (ctx) => {
  const orgs = await ctx.db.query("organization").collect();

  return ctx.user.role === "org_admin"
    ? orgs.filter((org) => org._id === ctx.user.org_id)
    : orgs;
});

export const getOrgByName = adminQuery({
  args: { org_name: v.string() },
  handler: async (ctx, args) => {
    const organization = await ctx.db
      .query("organization")
      .withIndex("by_organization_name", (q) => q.eq("organization_name", args.org_name))
      .first();

    if (!organization) return "No organization found.";
    requireOrganizationAccess(ctx.user, organization._id);

    return organization;
  }
})
