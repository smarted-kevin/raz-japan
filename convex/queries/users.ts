import { internalQuery } from "../_generated/server";
import { ConvexError, v } from "convex/values";
import { adminQuery, authedQuery, requireUserAccess } from "../lib/auth";


export const userAuthorized = authedQuery({
  args: { role: v.union(v.literal("user"), v.literal("admin"), v.literal("org_admin"), v.literal("god")) },
  handler: async (ctx) => {
    return ctx.user.auth_id ?? "nothing";
    
  //   const user = await ctx.db.get(userId);

  //   //if(!user) throw new ConvexError("Not Authenticated");

  //   return {
  //     role: user?.role,
  //     id: user?._id
  //   }

  }
});

export const getUserById = authedQuery({
  args: { id: v.id("userTable") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.id);
    if (user) requireUserAccess(ctx.user, user);
    return user;
  }
});

export const getUserByIdInternal = internalQuery({
  args: { id: v.id("userTable") },
  handler: async (ctx, args) => ctx.db.get(args.id),
});

export const getUsersByRole = adminQuery({
  args: { role: v.union(v.literal("user"), v.literal("admin"), v.literal("org_admin"), v.literal("god")) },
  handler: async (ctx, args) => {
    const users = await ctx.db
      .query("userTable")
      .withIndex("users_by_role", (q) => q.eq("role", args.role))
      .collect();

    return ctx.user.role === "org_admin"
      ? users.filter((user) => user.org_id === ctx.user.org_id)
      : users;
  }
})

export const getUserByEmail = adminQuery({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("userTable")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (user) requireUserAccess(ctx.user, user);
    return user ? {
      _id: user?._id,
      roles: user?.role,
    } : null;
  }
});

export const getUserWithStudents = authedQuery({
  args: { id: v.id("userTable") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.id);
    if (!user) return null;
    requireUserAccess(ctx.user, user);

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
      auth_id: user.auth_id,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      status: user.status,
      students: studentsWithClassroom || [],
    }
  }
})

/**
 * Get user detail for admin view - includes role, students with classroom/status/expiry, and orders
 */
export const getUserDetailForAdmin = adminQuery({
  args: { id: v.id("userTable") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.id);
    if (!user) return null;
    requireUserAccess(ctx.user, user);

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
          user_id: student.user_id,
          expiry_date: student.expiry_date,
          status: student.status,
          classroom_name: classroom?.classroom_name ?? "N/A",
        };
      })
    );

    return {
      id: user._id,
      auth_id: user.auth_id,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      status: user.status,
      role: user.role,
      students: studentsWithClassroom,
    };
  },
});

export const getUsersWithStudents = adminQuery(async (ctx) => {
  
    const allUsers = await ctx.db.query("userTable").collect();
    const users = ctx.user.role === "org_admin"
      ? allUsers.filter((user) => user.org_id === ctx.user.org_id)
      : allUsers;

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
          role: user.role,
          students: studentsWithClassrooms,
        }
      })
    );
    return usersWithStudents;
  }  
);

export const getUserRoleByAuthId = authedQuery({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("userTable")
      .withIndex("user_by_auth_id", (q) => q.eq("auth_id", args.userId))
      .first();

    if (!user) throw new ConvexError("User not found");
    requireUserAccess(ctx.user, user);
    
    return {
      user_id: user._id,
      role: user.role,
      org_id: user.org_id,
      stripe_id: user.stripe_id,
      email: user.email,
    }
  }
});

export const getStripeUserInfoByAuthId = authedQuery({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("userTable")
      .withIndex("user_by_auth_id", (q) => q.eq("auth_id", args.userId))
      .first();
      
    if (!user) throw new ConvexError("User not found");
    requireUserAccess(ctx.user, user);

    return {
      user_id: user._id,
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role,
      org_id: user.org_id,
      stripe_id: user.stripe_id,
      email: user.email,
    }
  }
});

export const getUserWithOrgId = authedQuery({
  args: { id: v.id("userTable") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.id);
    if (!user) return null;
    requireUserAccess(ctx.user, user);

    return {
      id: user._id,
      role: user.role,
      org_id: user.org_id,
    };
  }
});
