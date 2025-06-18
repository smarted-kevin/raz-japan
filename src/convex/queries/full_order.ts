import { query } from "../_generated/server";
import { v } from "convex/values";

export const getAllOrders = query( async (ctx) => {
  const orders = await ctx.db.query("full_order").collect();

  return orders;
})