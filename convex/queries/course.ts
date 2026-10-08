import { query, internalQuery } from "../_generated/server";
import { v } from "convex/values";
import { adminQuery } from "../lib/auth";

export const getCourseInternal = internalQuery({
  args: { id: v.id("course") },
  handler: (ctx, args) => ctx.db.get(args.id),
});
export const adminCourses = adminQuery({
  args: {},
  handler: async (ctx) => {
    if (ctx.user.role === "org_admin")
      throw new Error("Global admin access required");
    return ctx.db.query("course").collect();
  },
});

export const getAllCourses = query(async (ctx) => {
  const courses = await ctx.db.query("course").collect();

  return courses;
});

export const getCourseById = query({
  args: { id: v.id("course") },
  handler: async (ctx, args) => {
    const course = await ctx.db.get(args.id);
    return course;
  },
});

export const getCourseByCourseName = query({
  args: { course_name: v.string() },
  handler: async (ctx, args) => {
    const course = await ctx.db
      .query("course")
      .withIndex("by_course_name", (q) => q.eq("course_name", args.course_name))
      .first();

    if (!course) return "Course not found.";

    return course;
  },
});
