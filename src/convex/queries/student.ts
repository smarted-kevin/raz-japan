import { query } from "../_generated/server";
import { v } from "convex/values";

export const getStudentById = query({
  args: { id: v.id("student") },
  handler: async (ctx, args) => {
    const student = await ctx.db.get(args.id);
    return student;
  }
});

export const getStudentsByClassroomId = query({
  args: { classroom_id: v.id("classroom") },
  handler: async (ctx, args) => {
    const students = await ctx.db
      .query("student")
      .withIndex("by_classroom_id", (q) => q.eq("classroom_id", args.classroom_id))
      .collect();
      
    return students;
  }
});

export const getAllStudentsWithClassroomAndUser = query({
  args: {},
  handler: async (ctx) => {
    const students = await ctx.db
      .query("student")
      .collect();

    return await Promise.all(students.map(async (student) => {
      const classroom = student.classroom_id ? await ctx.db.get(student.classroom_id) : undefined;
      const user = student.user_id ? await ctx.db.get(student.user_id) : undefined;

      return {
        id: student._id, 
        username: student.username,
        password: student.password,
        user_id: student.user_id,
        user_email: user?.email ?? undefined,
        expiry_date: student.expiry_date,
        status: student.status,
        classroom_name: classroom?.classroom_name,
      }
    }));
  }
});

//Returns array
export const getStudentCountInClassroomByStatus = query({
  handler: async (ctx) => {
    const classrooms = await ctx.db.query("classroom").collect();

    const studentCounts = await Promise.all(classrooms.map(async (classroom) => {
      const students = await ctx.db
        .query("student")
        .withIndex("by_classroom_id", (q) => q.eq("classroom_id", classroom._id))
        .collect();

      return {
        classroom_id: classroom._id,
        active_count: students.filter((student) => student.status === "active").length,
        inactive_count: students.filter((student) => student.status === "inactive").length,
        removed_count: students.filter((student) => student.status === "removed").length
      };
    }));

    return studentCounts;
  }
});