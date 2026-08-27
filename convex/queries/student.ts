import { internalQuery } from "../_generated/server";
import { v } from "convex/values";
import { adminQuery, authedQuery, isAdminRole, requireOrganizationAccess, requireUserAccess } from "../lib/auth";

export const getStudentById = authedQuery({
  args: { id: v.id("student") },
  handler: async (ctx, args) => {
    const student = await ctx.db.get(args.id);
    if (student?.user_id) {
      const owner = await ctx.db.get(student.user_id);
      if (owner) requireUserAccess(ctx.user, owner);
    } else if (!isAdminRole(ctx.user.role)) {
      throw new Error("Student access denied");
    }
    return student;
  }
});

export const getStudentsByClassroomId = adminQuery({
  args: { classroom_id: v.id("classroom") },
  handler: async (ctx, args) => {
    const classroom = await ctx.db.get(args.classroom_id);
    if (!classroom) return [];
    requireOrganizationAccess(ctx.user, classroom.organization_id);
    const students = await ctx.db
      .query("student")
      .withIndex("by_classroom_id", (q) => q.eq("classroom_id", args.classroom_id))
      .collect();
      
    return students.map((student) => ({
      id: student._id,
      username: student.username,
      password: student.password,
      user_id: student.user_id,
      expiry_date: student.expiry_date,
      status: student.status,
    }));
  }
});

export const getAvailableStudent = internalQuery({
  handler: async (ctx) => {
    const student = await ctx.db
      .query("student")
      .withIndex("by_status", (q) => q.eq("status", "inactive"))
      .first();
    
    const classroom = student && student.classroom_id ? await ctx.db.get(student.classroom_id) : undefined;
    const course = classroom && classroom.course_id ? await ctx.db.get(classroom.course_id) : undefined;

    return {
      student: {
        id: student?._id,
        username: student?.username,
        status: student?.status,
      }, 
      classroom: {
        classroom_name: classroom?.classroom_name,
      },
      course: {
        course_name: course?.course_name,
        price: course?.price
      }
    }
  } 
});

export const getAllStudentsWithClassroomAndUser = adminQuery({
  args: {},
  handler: async (ctx) => {
    const allStudents = await ctx.db
      .query("student")
      .collect();
    const students = ctx.user.role === "org_admin"
      ? (await Promise.all(allStudents.map(async (student) => ({
          student,
          classroom: student.classroom_id ? await ctx.db.get(student.classroom_id) : null,
        })))).filter(({ classroom }) => classroom?.organization_id === ctx.user.org_id).map(({ student }) => student)
      : allStudents;

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

export const getStudentsByOrganization = adminQuery({
  args: { org_id: v.id("organization") },
  handler: async (ctx, args) => {
    requireOrganizationAccess(ctx.user, args.org_id);
    // First get all classrooms belonging to this organization
    const classrooms = await ctx.db
      .query("classroom")
      .withIndex("by_organization", (q) => q.eq("organization_id", args.org_id))
      .collect();

    const classroomIds = new Set(classrooms.map((c) => c._id));

    // Get all students
    const allStudents = await ctx.db.query("student").collect();

    // Filter students that belong to classrooms in this organization
    const orgStudents = allStudents.filter(
      (student) => student.classroom_id && classroomIds.has(student.classroom_id)
    );

    return await Promise.all(orgStudents.map(async (student) => {
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
      };
    }));
  }
});

export const getRenewalStudentsWithClassroomAndCourse = authedQuery({
  args: { ids: v.array(v.id("student")) },
  handler: async (ctx, args) => {
    const students = await Promise.all(args.ids.map(async (id) => {
      const student = await ctx.db.get(id);
      if (student?.user_id) {
        const owner = await ctx.db.get(student.user_id);
        if (owner) requireUserAccess(ctx.user, owner);
      } else if (!isAdminRole(ctx.user.role)) {
        throw new Error("Student access denied");
      }
      const classroom = student && student.classroom_id ? await ctx.db.get(student.classroom_id) : undefined;
      const course = classroom && classroom.course_id ? await ctx.db.get(classroom.course_id) : undefined;
      
      return {
        student: {
          id: student?._id,
          username: student?.username,
          status: student?.status,
        }, 
        classroom: {
          classroom_name: classroom?.classroom_name,
        },
        course: {
          course_name: course?.course_name,
          price: course?.price,
          stripe_price_id: course?.stripe_price_id
        }
      }
    }));
    
    return students;
  }
})

export const getRenewalStudentsWithClassroomAndCourseInternal = internalQuery({
  args: { ids: v.array(v.id("student")) },
  handler: async (ctx, args) => {
    return Promise.all(args.ids.map(async (id) => {
      const student = await ctx.db.get(id);
      const classroom = student?.classroom_id
        ? await ctx.db.get(student.classroom_id)
        : undefined;
      const course = classroom?.course_id
        ? await ctx.db.get(classroom.course_id)
        : undefined;

      return {
        student: {
          id: student?._id,
          username: student?.username,
          status: student?.status,
        },
        classroom: {
          classroom_name: classroom?.classroom_name,
        },
        course: {
          course_name: course?.course_name,
          price: course?.price,
          stripe_price_id: course?.stripe_price_id,
        },
      };
    }));
  },
});

//Returns array
export const getStudentCountInClassroomByStatus = adminQuery({
  handler: async (ctx) => {
    const allClassrooms = await ctx.db.query("classroom").collect();
    const classrooms = ctx.user.role === "org_admin"
      ? allClassrooms.filter((classroom) => classroom.organization_id === ctx.user.org_id)
      : allClassrooms;

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

/**
 * Finds students expiring in approximately 1 month (30 days)
 * Returns students with their user and course information for renewal notices
 */
export const getStudentsExpiringInOneMonth = internalQuery({
  handler: async (ctx) => {
    const now = Date.now();
    const oneMonthFromNow = now + 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
    const oneDayBefore = oneMonthFromNow - 24 * 60 * 60 * 1000; // 1 day before to account for timing
    
    // Get all active students with expiry dates
    const allStudents = await ctx.db
      .query("student")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();

    // Filter students expiring in approximately 1 month (within a 2-day window)
    const expiringStudents = allStudents.filter((student) => {
      if (!student.expiry_date) return false;
      return student.expiry_date >= oneDayBefore && student.expiry_date <= oneMonthFromNow;
    });

    // Get user and course information for each expiring student
    const studentsWithDetails = await Promise.all(
      expiringStudents.map(async (student) => {
        const user = student.user_id ? await ctx.db.get(student.user_id) : undefined;
        const classroom = student.classroom_id ? await ctx.db.get(student.classroom_id) : undefined;
        const course = classroom && classroom.course_id ? await ctx.db.get(classroom.course_id) : undefined;

        return {
          studentId: student._id,
          username: student.username,
          expiryDate: student.expiry_date,
          userId: student.user_id,
          userEmail: user?.email,
          userFirstName: user?.first_name,
          userLastName: user?.last_name,
          courseName: course?.course_name,
          coursePrice: course?.price,
        };
      })
    );

    // Group by user to avoid sending multiple emails to the same user
    const studentsByUser = new Map<string, typeof studentsWithDetails>();
    
    studentsWithDetails.forEach((student) => {
      if (student.userId && student.userEmail) {
        const userId = student.userId;
        if (!studentsByUser.has(userId)) {
          studentsByUser.set(userId, []);
        }
        studentsByUser.get(userId)!.push(student);
      }
    });

    return Array.from(studentsByUser.entries())
      .filter(([, students]) => students.length > 0)
      .map(([, students]) => {
        const firstStudent = students[0];
        if (!firstStudent) {
          throw new Error("Unexpected: empty students array after filter");
        }
        // firstStudent.userId is guaranteed to exist because we only added students where userId && userEmail were truthy
        if (!firstStudent.userId) {
          throw new Error("Unexpected: student without userId in grouped results");
        }
        return {
          userId: firstStudent.userId,
          userEmail: firstStudent.userEmail ?? "",
          userFirstName: firstStudent.userFirstName ?? "Valued Customer",
          userLastName: firstStudent.userLastName ?? "",
          expiringStudents: students,
        };
      });
  },
});
