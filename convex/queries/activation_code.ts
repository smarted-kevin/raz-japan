import { query } from "../_generated/server";
import { v } from "convex/values";

export const getActivationCodeByCode = query({
  args: { activation_code: v.string() },
  handler: async (ctx, args) => {
    const activationCode = await ctx.db
      .query("activation_code")
      .withIndex("by_activation_code", (q) => q.eq("activation_code", args.activation_code))
      .first();

    if (!activationCode) return null;

    // Get course information
    const course = await ctx.db.get(activationCode.course);

    return {
      id: activationCode._id,
      activation_code: activationCode.activation_code,
      course_id: activationCode.course,
      course_name: course?.course_name,
      organization_id: activationCode.organization_id,
      order_id: activationCode.order_id,
      activated_date: activationCode.activated_date,
      removed_date: activationCode.removed_date,
      created_date: activationCode.created_date,
      is_printed: activationCode.is_printed,
      printed_date: activationCode.printed_date,
    };
  }
});

export const getAllActivationCodes = query(async (ctx) => {
  const activationCodes = await ctx.db
    .query("activation_code")
    .collect();

  return Promise.all(
    activationCodes.map(async (code) => {
      const organization = await ctx.db.get(code.organization_id);
      return {
        id: code._id,
        activation_code: code.activation_code,
        organization_id: code.organization_id,
        organization_name: organization?.organization_name ?? "",
        activated_date: code.activated_date,
        removed_date: code.removed_date,
        created_date: code.created_date,
      };
    })
  );
});

