import { query } from "../_generated/server";
import { v } from "convex/values";

export const getAllCourses = query( async (ctx) => {
  const courses = await ctx.db.query("course").collect();

  return courses;
})

export const getCourseByCourseName = query({
  args:  { course_name: v.string() },
  handler: async (ctx, args) => {
    const course = await ctx.db
      .query("course")
      .withIndex("by_course_name", 
        (q) => q.eq("course_name", args.course_name))
      .first();

    if (!course) return "Course not found.";

    return course;
  }
})