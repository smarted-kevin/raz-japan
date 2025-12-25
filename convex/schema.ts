
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  userTable: defineTable({
    auth_id: v.optional(v.string()),
    first_name: v.string(),
    last_name: v.string(),
    email: v.string(),
    stripe_id: v.optional(v.string()),
    role: v.union(v.literal("user"), v.literal("admin"), v.literal("god")),
    updated_at: v.number(),
    last_login: v.optional(v.number()),
    status: v.union(v.literal("active"), v.literal("inactive")),
  }).index("by_email", ["email"])
    .index("users_by_role", ["role"])
    .index("user_by_auth_id", ["auth_id"]),

  session: defineTable({
    sessionId: v.string(),
    user_id: v.id("userTable"),
    role: v.union(v.literal("user"), v.literal("admin"), v.literal("god")),
    expires_at: v.number(),
  }).index("by_user_id", ["user_id"]).index("by_session_id", ["sessionId"]),

  verification_token: defineTable({
    identifier: v.string(),
    token: v.string(),
    expires: v.number(),
  }).index("by_identifier_token", ["identifier", "token"]),

  student: defineTable({
    username: v.string(),
    password: v.string(),
    user_id: v.optional(v.id("userTable")),
    classroom_id: v.optional(v.id("classroom")),
    course_id: v.optional(v.id("course")),
    start_date: v.optional(v.number()),
    expiry_date: v.optional(v.number()),
    created_on: v.number(),
    updated_on: v.number(),
    status: v.union(v.literal("active"), v.literal("inactive"), v.literal("removed")),
    cart_id: v.optional(v.id("cart")),
  }).index("by_username_classroom", ["username", "classroom_id"])
    .index("by_user_id", ["user_id"])
    .index("by_classroom_id", ["classroom_id"])
    .index("by_status", ["status"]),

  event: defineTable({
    type: v.string(),
    user_id: v.id("userTable"),
    student_id: v.optional(v.id("student")),
    created_date: v.number(),
    updated_date: v.number(),
  }).index("by_user_id", ["user_id"]),

  classroom: defineTable({
    classroom_name: v.string(),
    course_id: v.id("course"),
    organization_id: v.id("organization"),
    status: v.union(v.literal("active"), v.literal("inactive")),
    username_words: v.optional(v.array(v.string())),
    password_words: v.optional(v.array(v.string())),
    created_date: v.number(),
    updated_date: v.number(),
    removed_date: v.optional(v.number()),
  })
    .index("by_classroom_name", ["classroom_name"])
    .index("by_organization", ["organization_id"])
    .index("by_classroom_status", ["status"]),

  course: defineTable({
    course_name: v.string(),
    price: v.number(),
    stripe_price_id: v.optional(v.string()),
    stripe_product_id: v.optional(v.string()),
    status: v.union(v.literal("active"), v.literal("inactive")),
  }).index("by_course_name", ["course_name"]),

  organization: defineTable({
    organization_name: v.string(),
    status: v.union(v.literal("active"), v.literal("inactive")),
  }).index("by_organization_name", ["organization_name"]),

  activation_code: defineTable({
    activation_code: v.string(),
    course: v.id("course"),
    organization_id: v.id("organization"),
    order_id: v.id("full_order"),
    activated_date: v.optional(v.number()),
    removed_date: v.optional(v.number()),
    created_date: v.number(),
    is_printed: v.boolean(),
    printed_date: v.optional(v.number()),
  }).index("by_activation_code", ["activation_code"]),

  promotion_code: defineTable({
    promotion_code: v.string(),
    type: v.string(),
    percent_discount: v.optional(v.number()),
    monetary_discount: v.optional(v.number()),
    times_used: v.number(),
    organization_id: v.id("organization"),
    start_date: v.optional(v.number()),
    expiry_date: v.optional(v.number()),
    created_date: v.number(),
  }).index("by_promotion_code", ["promotion_code"]),

  cart: defineTable({
    user_id: v.id("userTable"),
    created_date: v.number(),
    updated_on: v.number(),
    new_students: v.number(),
    renewal_students: v.optional(v.array(v.id("student")))
  }).index("by_user_id", ["user_id"]),

  full_order: defineTable({
    user_id: v.id("userTable"),
    total_amount: v.number(),
    stripe_order_id: v.optional(v.string()),
    status: v.optional(v.union(v.literal("created"), v.literal("pending"), v.literal("fulfilled"), v.literal("canceled"))),
    promotion_id: v.optional(v.id("promotion_code")),
    updated_date: v.number(),
    order_number: v.optional(v.string()),
  }).index("by_user_id", ["user_id"])
    .index("by_stripe_order_id", ["stripe_order_id"])
    .index("by_status", ["status"])
    .index("by_order_number", ["order_number"]),

  student_order: defineTable({
    activation_id: v.optional(v.id("activation_code")),
    amount: v.number(),
    order_id: v.id("full_order"),
    order_type: v.union(v.literal("new"), v.literal("renewal"), v.literal("reactivation")),
    student_id: v.id("student"),
    created_date: v.number(),
    updated_on: v.number(),
  })
    .index("by_activation_id", ["activation_id"])
    .index("by_order_id", ["order_id"])
    .index("by_student_id", ["student_id"]),

  order_counter: defineTable({
    counter_name: v.string(),
    value: v.number(),
  }).index("by_counter_name", ["counter_name"]),
});

