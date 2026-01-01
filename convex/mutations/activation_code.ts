import { mutation } from "../_generated/server";
import { v } from "convex/values";

export const createActivationCode = mutation({
  args: {
    quantity: v.optional(v.number()),
    course_id: v.id("course"),
    organization_id: v.id("organization"),
  },
  handler: async (ctx, args) => {
    const chars = "123456789ABCDEFGHJKMNPQRSTUVWXYZ";
    const quantity = args.quantity ?? 1;
    const activation_codes: string[] = [];
    for (let i = 0; i < quantity; i++) {
      let activation_code = "";
      for (let i = 0; i < 6; i++) {
        activation_code += chars[Math.floor(Math.random() * chars.length)];
      }
      while (await ctx.db.query("activation_code").withIndex("by_activation_code", (q) => q.eq("activation_code", activation_code)).first()) {
        activation_code = "";
        for (let i = 0; i < 6; i++) {
          activation_code += chars[Math.floor(Math.random() * chars.length)];
        }
      }
      activation_codes.push(activation_code);
      await ctx.db.insert("activation_code", {
        activation_code: activation_code,
        course: args.course_id,
        organization_id: args.organization_id,
        created_date: Date.now(),
        is_printed: false,
      });
    }
    return activation_codes ?? [];
  }
})