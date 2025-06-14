import { mutation } from "../_generated/server";
import { v } from "convex/values";

export const createStudent = mutation({
  args: { 
    username: v.string(),
    password: v.string(),
    course_id: v.id("course"),
    classroom_id: v.id("classroom"),
    status: v.union(v.literal("active"), v.literal("inactive"), v.literal("removed")),
  },
  handler: async (ctx, args) => {
    const student = await ctx.db.insert(
      "student",
      {
        ...args,
        user_id: undefined,
        cart_id: undefined,
        last_login: undefined,
        created_on: Date.now(),
        updated_on: Date.now()
      }
    )
    return student;
  }
});

export const createStudents = mutation({
  args: { 
    students: v.array(v.object({
      username: v.string(),
      password: v.string(),
      course_id: v.id("course"),
      classroom_id: v.id("classroom"),
      status: v.union(v.literal("active"), v.literal("inactive"), v.literal("removed"))
    }))
  },
  handler: async (ctx, args) => {
    const createdStudents = await Promise.all(
      args.students.map(student => 
        ctx.db.insert("student", {
          ...student,
          created_on: Date.now(),
          updated_on: Date.now(),
          user_id: undefined,
          cart_id: undefined,
          last_login: undefined
        })
      )
    );
    return createdStudents;
  }
});

export const editStudent = mutation({
  args: {
    student_id: v.id("student"), 
    username: v.optional(v.string()),
    password: v.optional(v.string()),
    classroom_id: v.optional(v.id("classroom"))
   },
  handler: async (ctx, args) => {
    const student = await ctx.db.get(args.student_id);

    if (!student) return "Student not found."

    const updated_student = await ctx.db
      .patch(args.student_id, 
        {
          username: args.username ?? student.username,
          password: args.password ?? student.password,
          classroom_id: args.classroom_id ?? student.classroom_id
        }
      )
    
    return updated_student;
  }
});

export const activateStudent = mutation({
  args: { 
    student_id: v.id("student"),
    email: v.string() 
  },
  handler: async (ctx, args) => {
    const student = await ctx.db.get(args.student_id);
    if (!student) {
      return "Student not found";
    }
    //check if student is already active
    if (student.status === "active") {
      return "Student is already active";
    }

    //Get user Id from user email
    const user = await ctx.db
      .query("user")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
    
    if (!user) return "User not found.";

    const start_date = new Date();

    const updated_student = ctx.db
      .patch(args.student_id, 
        {
          "status": "active",
          "expiry_date": new Date(start_date.setFullYear(start_date.getFullYear()+1)).getTime(),
          user_id: user._id
        }
      )
    return updated_student;
  }
})

export const setStudentStatus = mutation({
  args: { 
    student_id: v.id("student"),
    status: v.union(v.literal("active"), v.literal("inactive"), v.literal("removed"))
  },
  handler: async (ctx, args) => {
    const student = await ctx.db.get(args.student_id);
    if (!student) {
      return "Student not found";
    }
    const updatedStudent = await ctx.db.patch(args.student_id, { status: args.status});
    return updatedStudent;
  }
})