import { query } from "../_generated/server";
import { v } from "convex/values";

export const getAllOrganizations = query(async (ctx) => {
  const orgs = await ctx.db.query("organization").collect();

  return orgs;
});

export const getOrgByName = query({
  args: { org_name: v.string() },
  handler: async (ctx, args) => {
    const organization = await ctx.db
      .query("organization")
      .withIndex("by_organization_name", (q) => q.eq("organization_name", args.org_name))
      .first();

    if (!organization) return "No organization found.";

    return organization;
  }
})