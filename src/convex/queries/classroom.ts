import { query } from "../_generated/server";
import { v } from "convex/values";

export const getAllClassrooms = query( async (ctx) => {
  const classrooms = await ctx.db
    .query("classroom")
    .collect();

    return classrooms;
})

export const getAllClassroomsWithCourseAndOrgName = query({
  args: { student_counts: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    const classrooms = await ctx.db
      .query("classroom")
      .collect();

    return Promise.all(
      classrooms.map(async (classroom) => {
        const students = args.student_counts ? await ctx.db
          .query("student")
          .withIndex("by_classroom_name", (q) => q.eq("classroom_id", classroom._id))
          .collect()
        : undefined;

        const course = await ctx.db.get(classroom.course_id);
        const org = classroom.organization_id
            ? await ctx.db.get(classroom.organization_id)
            : undefined;
        return {
          classroom_id: classroom._id,
          classroom_name: classroom.classroom_name,
          status: classroom.status,
          course_name: course?.course_name ?? undefined,
          organization_name: org?.organization_name ?? undefined,
          active_students: students?.filter((student) => student.status === "active").length ?? undefined,
          inactive_students: students?.filter((student) => student.status === "inactive").length ?? undefined,
          removed_students: students?.filter((student) => student.status === "removed").length ?? undefined,
        }
      })
    );
  }
})

export const getClassroomByName = query({
  args: { classroom_name: v.string() },
  handler: async (ctx, args) => {
    const classroom = await ctx.db
      .query("classroom")
      .withIndex("by_classroom_name", 
        (q) => q.eq("classroom_name", args.classroom_name))
      .first();

    return classroom;
  }
})

export const getClassroomsByStatus = query({
  args: { status: v.union(v.literal("active"), v.literal("inactive")) },
  handler: async (ctx, args) => {
    const classrooms = await ctx.db
      .query("classroom")
      .withIndex("by_classroom_status", (q) => q.eq("status", args.status))
      .collect();

    return classrooms;
  }
})