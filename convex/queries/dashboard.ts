import { query } from "../_generated/server";

/**
 * Gets dashboard statistics for admin page
 * Returns:
 * - Number of active users
 * - Total number of students (all statuses)
 * - Students expiring within the current month
 * - Total number of students by course
 */
export const getDashboardStats = query({
  handler: async (ctx) => {
    // 1. Get number of active users
    const allUsers = await ctx.db.query("userTable").collect();
    const activeUsersCount = allUsers.filter((user) => user.status === "active").length;

    // 2. Get total number of students (active, inactive, removed)
    const allStudents = await ctx.db.query("student").collect();
    const totalStudentsCount = allStudents.length;
    const activeStudentsCount = allStudents.filter((s) => s.status === "active").length;
    const inactiveStudentsCount = allStudents.filter((s) => s.status === "inactive").length;
    const removedStudentsCount = allStudents.filter((s) => s.status === "removed").length;

    // 3. Get students expiring within the current month
    const now = Date.now();
    const currentDate = new Date(now);
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getTime();
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59, 999).getTime();

    const studentsExpiringThisMonth = allStudents
      .filter((student) => {
        if (!student.expiry_date) return false;
        return student.expiry_date >= startOfMonth && student.expiry_date <= endOfMonth;
      })
      .map((student) => {
        return {
          id: student._id,
          username: student.username,
          expiry_date: student.expiry_date,
          status: student.status,
          course_id: student.course_id,
          classroom_id: student.classroom_id,
        };
      });

    // Get course info for expiring students
    const expiringStudentsWithDetails = await Promise.all(
      studentsExpiringThisMonth.map(async (student) => {
        // Try to get course directly from student's course_id
        let course = student.course_id ? await ctx.db.get(student.course_id) : undefined;
        
        // If no direct course_id, try to get it through classroom
        if (!course && student.classroom_id) {
          const classroom = await ctx.db.get(student.classroom_id);
          if (classroom?.course_id) {
            course = await ctx.db.get(classroom.course_id);
          }
        }
        
        return {
          id: student.id,
          username: student.username,
          expiry_date: student.expiry_date,
          status: student.status,
          course_name: course?.course_name ?? "Unknown",
        };
      })
    );

    // 4. Get total number of students by course
    const courses = await ctx.db.query("course").collect();
    const allClassrooms = await ctx.db.query("classroom").collect();
    
    // Create a map of classroom_id to course_id for quick lookup
    const classroomToCourseMap = new Map(
      allClassrooms.map((c) => [c._id, c.course_id])
    );
    
    const studentsByCourse = courses.map((course) => {
      // Students can have course_id directly or through classroom
      const studentsWithDirectCourse = allStudents.filter(
        (s) => s.course_id === course._id
      );
      
      // Get students in classrooms that belong to this course
      const studentsInClassrooms = allStudents.filter((s) => {
        if (!s.classroom_id) return false;
        const classroomCourseId = classroomToCourseMap.get(s.classroom_id);
        return classroomCourseId === course._id;
      });
      
      // Combine both (avoid duplicates)
      const allCourseStudents = [
        ...studentsWithDirectCourse,
        ...studentsInClassrooms.filter(
          (s) => !studentsWithDirectCourse.some((ds) => ds._id === s._id)
        ),
      ];
      
      return {
        course_id: course._id,
        course_name: course.course_name,
        total_students: allCourseStudents.length,
        active_students: allCourseStudents.filter((s) => s.status === "active").length,
        inactive_students: allCourseStudents.filter((s) => s.status === "inactive").length,
        removed_students: allCourseStudents.filter((s) => s.status === "removed").length,
      };
    });

    return {
      activeUsersCount,
      totalStudentsCount,
      studentsByStatus: {
        active: activeStudentsCount,
        inactive: inactiveStudentsCount,
        removed: removedStudentsCount,
      },
      studentsExpiringThisMonth: expiringStudentsWithDetails,
      studentsByCourse,
    };
  },
});

