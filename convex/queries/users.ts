import { query } from "../_generated/server";
import { ConvexError, v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";


export const userAuthorized = query({
  args: { role: v.union(v.literal("user"), v.literal("admin"), v.literal("admin")) },
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    return userId ?? "nothing";
    
  //   const user = await ctx.db.get(userId);

  //   //if(!user) throw new ConvexError("Not Authenticated");

  //   return {
  //     role: user?.role,
  //     id: user?._id
  //   }

  }
});

export const getUserById = query({
  args: { id: v.id("userTable") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.id);
    return user;
  }
});

export const getUsersByRole = query({
  args: { role: v.union(v.literal("user"), v.literal("admin")) },
  handler: async (ctx, args) => {
    const users = await ctx.db
      .query("userTable")
      .withIndex("users_by_role", (q) => q.eq("role", args.role))
      .collect();

    return users;
  }
})

export const getUserByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("userTable")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    return user ? {
      _id: user?._id,
      roles: user?.role,
    } : null;
  }
});

export const getUserWithStudents = query({
  args: { id: v.id("userTable") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.id);
    if (!user) return null;

    const students = await ctx.db
      .query("student")
      .withIndex("by_user_id", (q) => q.eq("user_id", args.id))
      .collect();

    const studentsWithClassroom = await Promise.all(
      students.map(async (student) => {
        const classroom = student.classroom_id ? await ctx.db.get(student.classroom_id) : undefined;
        return {
          id: student._id, 
          username: student.username,
          password: student.password,
          user_id: student.user_id,
          user_email: user.email,
          expiry_date: student.expiry_date,
          status: student.status,
          classroom_name: classroom?.classroom_name,
        };
      })
    );
    
    return {
      id: user._id,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      status: user.status,
      students: studentsWithClassroom || [],
    }
  }
})

export const getUsersWithStudents = query(async (ctx) => {
  
    const users = await ctx.db.query("userTable").collect();

    const usersWithStudents = await Promise.all(
      users.map(async (user) => {
      const students = await ctx.db
        .query("student")
        .withIndex("by_user_id", (q) => q.eq("user_id", user._id))
        .collect();

        const studentsWithClassrooms = await Promise.all(
          students.map(async (student) => {
            const classroom = student.classroom_id ? await ctx.db.get(student.classroom_id) : undefined;
            return {
              id: student._id, 
              username: student.username,
              password: student.password,
              user_id: student.user_id,
              user_email: user.email,
              expiry_date: student.expiry_date,
              status: student.status,
              classroom_name: classroom?.classroom_name,
            };
          })
        );
        return {
          id: user._id,
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
          status: user.status,
          students: studentsWithClassrooms,
        }
      })
    );
    return usersWithStudents;
  }  
);

export const getUserRoleByAuthId = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("userTable")
      .withIndex("user_by_auth_id", (q) => q.eq("auth_id", args.userId))
      .first();

    if (!user) throw new ConvexError("User not found");
    
    return {
      user_id: user._id,
      role: user.role
    }
  }
})
