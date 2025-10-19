import { mutation } from "../_generated/server";
import { v } from "convex/values";

export const createClassroom = mutation({
  args: { 
    classroom_name: v.string(),
    course_name: v.string(),
    organization: v.string(),
  },
  handler: async (ctx, args) => {
    const course = await ctx.db
      .query("course")
      .withIndex("by_course_name", (q) => q.eq("course_name", args.course_name))
      .first();
    if (!course) return "Course not found."

    const org = await ctx.db
      .query("organization")
      .withIndex("by_organization_name", (q) => q.eq("organization_name", args.organization))
      .first();
    if (!org) return "Organization not found."
    
    const new_class = await ctx.db
      .insert(
        "classroom",
        {
          classroom_name: args.classroom_name,
          course_id: course._id,
          organization_id: org._id,
          status: "active",
          created_date: Date.now(),
          updated_date: Date.now()
        }
      )
    const classroom = await ctx.db.get(new_class);

    return {
      classroom_id: classroom?._id,
      course_id: classroom?.course_id,
      organization_id: classroom?.organization_id,
    }
  }
});
