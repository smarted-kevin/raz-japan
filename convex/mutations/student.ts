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
      course_id: v.optional(v.id("course")),
      classroom_id: v.optional(v.id("classroom")),
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
    classroom_id: v.optional(v.id("classroom")),
    status: v.optional(v.union(v.literal("active"), v.literal("inactive"), v.literal("removed"))),
    expiry_date: v.optional(v.number())
   },
  handler: async (ctx, args) => {
    const student = await ctx.db.get(args.student_id);

    if (!student) return "Student not found."

    const updated_student = await ctx.db
      .patch(args.student_id, 
        {
          username: args.username ?? student.username,
          password: args.password ?? student.password,
          classroom_id: args.classroom_id ?? student.classroom_id,
          status: args.status ?? student.status,
          expiry_date: args.expiry_date ?? student.expiry_date
        }
      )
    
    return updated_student;
  }
});


export const activateStudent = mutation({
  args: { 
    student_id: v.id("student"),
    user_id: v.id("userTable")
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
    const user = await ctx.db.get(args.user_id);
    
    if (!user) return "User not found.";

    const start_date = new Date();

    await ctx.db
      .patch(args.student_id, 
        {
          "status": "active",
          "expiry_date": new Date(start_date.setFullYear(start_date.getFullYear()+1)).getTime(),
          user_id: user._id
        }
      ) 
    
    const return_student = await ctx.db.get(args.student_id);

    return {
      student_id: return_student?._id,
      username: return_student?.username,
      password: return_student?.password,
      expiry_date: return_student?.expiry_date
    };
  }
})

export const reactivateStudent = mutation({
  args: { student_id: v.id("student") },
  handler: async (ctx, args) => {
    const student = await ctx.db.get(args.student_id);
    if (!student) return "Student not found.";

    const start_date = new Date();

    await ctx.db.patch(
      args.student_id,
      { 
        "expiry_date": new Date(start_date.setFullYear(start_date.getFullYear()+1)).getTime(),
        "updated_on": Date.now()
      }
    )
    const return_student = await ctx.db.get(args.student_id);

    return {
      student_id: return_student?._id,
      username: return_student?.username,
      password: return_student?.password,
      expiry_date: return_student?.expiry_date
    };
  }
});

export const renewStudent = mutation({
  args: { student_id: v.id("student") },
  handler: async (ctx, args) => {
    const student = await ctx.db.get(args.student_id);
    if (!student || typeof student.expiry_date != "number" ) return "Something went wrong.";

    const start_date = new Date(student.expiry_date);

    await ctx.db.patch(
      args.student_id,
      { 
        "expiry_date": new Date(start_date.setFullYear(start_date.getFullYear()+1)).getTime(),
        "updated_on": Date.now()
      }
    )
    const return_student = await ctx.db.get(args.student_id);
    
    return {
      student_id: return_student?._id,
      username: return_student?.username,
      password: return_student?.password,
      expiry_date: return_student?.expiry_date
    };
  }
});

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