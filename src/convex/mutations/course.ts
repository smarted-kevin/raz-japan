import { mutation } from "../_generated/server";
import { v } from "convex/values";

export const createCourse = mutation({
  args: { 
    course_name: v.string(),
    price: v.number()
  },
  handler: async (ctx,args) => {
    const course = await ctx.db
      .query("course")
      .withIndex("by_course_name", (q) => q.eq("course_name", args.course_name))
      .first();
    
    if (course) return {error: "Course with that name already exists, choose a different name."};

    const new_course = await ctx.db.insert(
      "course",
      {
        course_name: args.course_name,
        price: args.price,
        status: "active",
      }
    )

    return {
      course_id: new_course
    };
  }
});

export const editCourse = mutation({
  args: {
    id: v.id("course"),
    course_name: v.optional(v.string()),
    price: v.optional(v.number()),
    status: v.optional(v.union(v.literal("active"), v.literal("inactive")))
  },
  handler: async (ctx, args) => {
    const course = await ctx.db.get(args.id);
    if (!course) return "No course found."

    const updated_course = await ctx.db
      .patch(
        args.id,
        {
          course_name: args.course_name ?? course.course_name,
          price: args.price ?? course.price,
          status: args.status ?? course.status
        }
      )
      return updated_course;
  }
});