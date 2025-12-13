import { internalMutation, mutation } from "../_generated/server";
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

    return new_course;
  }
});

export const updateCourseWithStripe = internalMutation({
  args: {
    course_id: v.id("course"),
    stripe_product_id: v.string(),
    stripe_price_id: v.string()
  },
  handler: async (ctx, args) => {
    const course = await ctx.db.get(args.course_id);
    if (!course) return "No course found."

    await ctx.db.patch(
      args.course_id,
      {
        stripe_price_id: args.stripe_price_id,
        stripe_product_id: args.stripe_product_id
      }
    );
    const updated_course = await ctx.db.get(args.course_id);
    
    
    return {
      course_id: updated_course?._id
    };
  }
})

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

    await ctx.db.patch(
      args.id,
      {
        course_name: args.course_name ?? course.course_name,
        price: args.price ?? course.price,
        status: args.status ?? course.status
      }
    )

    const updated_course = await ctx.db.get(args.id);
    return updated_course;
  }
});