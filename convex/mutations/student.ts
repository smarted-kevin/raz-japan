import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { generateOrderNumber } from "./full_order";

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

export const activateStudentByActivationCode = mutation({
  args: {
    activation_code: v.string(),
    user_id: v.id("userTable")
  },
  handler: async (ctx, args) => {
    // Find activation code
    const activationCode = await ctx.db
      .query("activation_code")
      .withIndex("by_activation_code", (q) => q.eq("activation_code", args.activation_code))
      .first();

    if (!activationCode) {
      return { success: false, error: "Activation code not found" };
    }

    // Check if activation code is already activated
    if (activationCode.activated_date) {
      return { success: false, error: "Activation code has already been used" };
    }

    // Check if activation code is removed
    if (activationCode.removed_date) {
      return { success: false, error: "Activation code has been removed" };
    }

    // Get course from activation code
    const course = await ctx.db.get(activationCode.course);
    if (!course) {
      return { success: false, error: "Course not found" };
    }

    // Find an inactive student for this course
    // First try to find a student with matching course_id
    const students = await ctx.db
      .query("student")
      .withIndex("by_status", (q) => q.eq("status", "inactive"))
      .collect();

    const availableStudent = students.find((student) => {
      if (!student.course_id) return false;
      return student.course_id === activationCode.course;
    });

    if (!availableStudent) {
      return { success: false, error: "No available student found for this course" };
    }

    // Verify user exists
    const user = await ctx.db.get(args.user_id);
    if (!user) {
      return { success: false, error: "User not found" };
    }

    // Activate the student
    const start_date = new Date();
    await ctx.db.patch(availableStudent._id, {
      status: "active",
      expiry_date: new Date(start_date.setFullYear(start_date.getFullYear() + 1)).getTime(),
      user_id: user._id,
      updated_on: Date.now()
    });

    // Create full_order
    const orderNumber = await generateOrderNumber(ctx);
    const fullOrderId = await ctx.db.insert("full_order", {
      user_id: user._id,
      total_amount: course.price,
      updated_date: Date.now(),
      stripe_order_id: undefined,
      status: "fulfilled",
      order_number: orderNumber,
      promotion_id: undefined,
    });

    // Create student_order with activation_id
    await ctx.db.insert("student_order", {
      activation_id: activationCode._id,
      amount: course.price,
      order_id: fullOrderId,
      order_type: "new",
      student_id: availableStudent._id,
      created_date: Date.now(),
      updated_on: Date.now(),
    });

    // Update activation code with activated_date and order_id
    await ctx.db.patch(activationCode._id, {
      activated_date: Date.now(),
      order_id: fullOrderId,
    });

    // Get the updated student
    const updatedStudent = await ctx.db.get(availableStudent._id);

    return {
      success: true,
      student: {
        student_id: updatedStudent?._id,
        username: updatedStudent?.username,
        password: updatedStudent?.password,
        expiry_date: updatedStudent?.expiry_date
      }
    };
  }
})

export const renewStudentByActivationCode = mutation({
  args: {
    activation_code: v.string(),
    student_id: v.id("student")
  },
  handler: async (ctx, args) => {
    // Find activation code
    const activationCode = await ctx.db
      .query("activation_code")
      .withIndex("by_activation_code", (q) => q.eq("activation_code", args.activation_code))
      .first();

    if (!activationCode) {
      return { success: false, error: "Activation code not found" };
    }

    // Check if activation code is already activated
    if (activationCode.activated_date) {
      return { success: false, error: "Activation code has already been used" };
    }

    // Check if activation code is removed
    if (activationCode.removed_date) {
      return { success: false, error: "Activation code has been removed" };
    }

    // Get course from activation code
    const course = await ctx.db.get(activationCode.course);
    if (!course) {
      return { success: false, error: "Course not found" };
    }

    // Get existing student
    const student = await ctx.db.get(args.student_id);
    if (!student) {
      return { success: false, error: "Student not found" };
    }

    // Check if student is active
    if (student.status !== "active") {
      return { success: false, error: "Student must be active to renew" };
    }

    // Check if student has a user assigned
    if (!student.user_id) {
      return { success: false, error: "Student must be assigned to a user" };
    }

    // Verify user exists
    const user = await ctx.db.get(student.user_id);
    if (!user) {
      return { success: false, error: "User not found" };
    }

    // Extend expiry date by 1 year from current expiry date
    const currentExpiryDate = student.expiry_date ?? Date.now();
    const newExpiryDate = new Date(currentExpiryDate);
    newExpiryDate.setFullYear(newExpiryDate.getFullYear() + 1);

    await ctx.db.patch(student._id, {
      expiry_date: newExpiryDate.getTime(),
      updated_on: Date.now()
    });

    // Create full_order
    const orderNumber = await generateOrderNumber(ctx);
    const fullOrderId = await ctx.db.insert("full_order", {
      user_id: user._id,
      total_amount: course.price,
      updated_date: Date.now(),
      stripe_order_id: undefined,
      status: "fulfilled",
      order_number: orderNumber,
      promotion_id: undefined,
    });

    // Create student_order with activation_id
    await ctx.db.insert("student_order", {
      activation_id: activationCode._id,
      amount: course.price,
      order_id: fullOrderId,
      order_type: "renewal",
      student_id: student._id,
      created_date: Date.now(),
      updated_on: Date.now(),
    });

    // Update activation code with activated_date and order_id
    await ctx.db.patch(activationCode._id, {
      activated_date: Date.now(),
      order_id: fullOrderId,
    });

    // Get the updated student
    const updatedStudent = await ctx.db.get(student._id);

    return {
      success: true,
      student: {
        student_id: updatedStudent?._id,
        username: updatedStudent?.username,
        password: updatedStudent?.password,
        expiry_date: updatedStudent?.expiry_date
      }
    };
  }
})