import { v } from "convex/values";
import { adminQuery, requireOrganizationAccess } from "../lib/auth";

export const getAllClassrooms = adminQuery( async (ctx) => {
  const allClassrooms = await ctx.db
    .query("classroom")
    .collect();

    return ctx.user.role === "org_admin"
      ? allClassrooms.filter((classroom) => classroom.organization_id === ctx.user.org_id)
      : allClassrooms;
})

export const getClassroomById = adminQuery({
  args: { id: v.id("classroom") },
  handler: async (ctx, args) => {
    const classroom = await ctx.db.get(args.id);
    if (!classroom) return null;
    requireOrganizationAccess(ctx.user, classroom.organization_id);
    return classroom;
  }
})

export const getAllClassroomsWithCourseAndOrgName = adminQuery({
  args: { student_counts: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    const allClassrooms = await ctx.db
      .query("classroom")
      .collect();
    const classrooms = ctx.user.role === "org_admin"
      ? allClassrooms.filter((classroom) => classroom.organization_id === ctx.user.org_id)
      : allClassrooms;

    return Promise.all(
      classrooms.map(async (classroom) => {
        const students = args.student_counts ? await ctx.db
          .query("student")
          .withIndex("by_classroom_id", (q) => q.eq("classroom_id", classroom._id))
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

export const getClassroomByName = adminQuery({
  args: { classroom_name: v.string() },
  handler: async (ctx, args) => {
    const classroom = await ctx.db
      .query("classroom")
      .withIndex("by_classroom_name", 
        (q) => q.eq("classroom_name", args.classroom_name))
      .first();

    if (classroom) requireOrganizationAccess(ctx.user, classroom.organization_id);
    return classroom;
  }
})

export const getClassroomsByStatus = adminQuery({
  args: { status: v.union(v.literal("active"), v.literal("inactive")) },
  handler: async (ctx, args) => {
    const classrooms = await ctx.db
      .query("classroom")
      .withIndex("by_classroom_status", (q) => q.eq("status", args.status))
      .collect();

    return ctx.user.role === "org_admin"
      ? classrooms.filter((classroom) => classroom.organization_id === ctx.user.org_id)
      : classrooms;
  }
});

export const classroomExportWithstudents = adminQuery({
  args: { classroom_id: v.id("classroom") },
  handler: async (ctx, args) => {
    const classroom = await ctx.db.get(args.classroom_id);

    if (!classroom) return null;
    requireOrganizationAccess(ctx.user, classroom.organization_id);
    
    const students = await ctx.db
      .query("student")
      .withIndex("by_classroom_id", (q) => q.eq("classroom_id", classroom._id))
      .collect();

    const studentUNandPW = students.map((s) => ({
      username: s.username,
      password: s.password
    })); 

    return {
      classroom_name: classroom.classroom_name,
      status: classroom.status,
      students: studentUNandPW ?? []
    }
  }
})

export const getClassroomsByOrganization = adminQuery({
  args: { org_id: v.id("organization"), student_counts: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    requireOrganizationAccess(ctx.user, args.org_id);
    const classrooms = await ctx.db
      .query("classroom")
      .withIndex("by_organization", (q) => q.eq("organization_id", args.org_id))
      .collect();

    return Promise.all(
      classrooms.map(async (classroom) => {
        const students = args.student_counts ? await ctx.db
          .query("student")
          .withIndex("by_classroom_id", (q) => q.eq("classroom_id", classroom._id))
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
        };
      })
    );
  }
});

