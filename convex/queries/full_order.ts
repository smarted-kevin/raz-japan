import { query } from "../_generated/server";
import { v } from "convex/values";
import { type Id } from "../_generated/dataModel";

export const getAllOrders = query({ 
  args: {},
  handler: async (ctx) => {
    const orders = await ctx.db.query("full_order").collect();
    return orders;
  }
});
/*

/**
 * Get all orders with user and student order data
 * @param args - The arguments for the query
 * @returns array of orders with user id and email, and array of student order data
 */
export const getOrdersWithUserAndStudentData = query({
  args: { status: v.optional(v.union(v.literal("created"), v.literal("pending"), v.literal("fulfilled"), v.literal("canceled"))),
    order_type: v.optional(v.union(v.literal("new"), v.literal("renewal"), v.literal("reactivation"))),
    student_id: v.optional(v.id("student")),
    user_id: v.optional(v.id("userTable")),
    promotion_id: v.optional(v.id("promotion_code")),
    stripe_order_id: v.optional(v.string()),
    updated_date: v.optional(v.number()),
    created_date: v.optional(v.number()),
    total_amount: v.optional(v.number()),
   },
  handler: async (ctx, args) => {
    //1. Get all full_orders
    const orders = args.status
      ? await ctx.db.query("full_order").withIndex("by_status", (q) => q.eq("status", args.status)).collect()
      : await ctx.db.query("full_order").collect();

    //2. For each order, get user data and student order data
    const result = await Promise.all(orders.map(async (order) => {
      // Get user data
      const user = await ctx.db.get(order.user_id);
      if (!user) {
        return null;
      }

      // Get student orders for this order
      const studentOrders = await ctx.db
        .query("student_order")
        .withIndex("by_order_id", (q) => q.eq("order_id", order._id))
        .collect();

      // Get student data for each student order
      const studentOrdersWithData = await Promise.all(studentOrders.map(async (student_order) => {
        const student = await ctx.db.get(student_order.student_id);
        if (!student) {
          return null;
        }

        return {
          id: student_order._id,
          amount: student_order.amount,
          order_id: student_order.order_id,
          order_type: student_order.order_type,
          username: student.username,
          expiry_date: student.expiry_date,
          status: student.status,
        };
      }));

      // Filter out null values
      const validStudentOrders = studentOrdersWithData.filter((so) => so !== null) as {
        id: Id<"student_order">;
        amount: number;
        order_id: Id<"full_order">;
        order_type: "new" | "renewal" | "reactivation";
        username: string;
        expiry_date: number | undefined;
        status: "active" | "inactive" | "removed";
      }[];

      return {
        user_id: user._id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        amount: order.total_amount,
        order_id: order._id,
        created_date: order._creationTime,
        order_number: order.order_number,
        student_orders: validStudentOrders,
      };
    }));

    // Filter out null values (orders without users)
    return result.filter((order) => order !== null);
  }
});

export const getOrderById = query({
  args: { id: v.id("full_order") },
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.id);
    return order;
  }
});

export const getOrderByStripeId = query({
  args: { stripe_id: v.string() },
  handler: async (ctx, args) => {
    const order = await ctx.db
      .query("full_order")
      .withIndex("by_stripe_order_id", (q) => q.eq("stripe_order_id", args.stripe_id))
      .first();
    return order;
  }
});