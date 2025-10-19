
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // users: defineTable({
  //   image: v.optional(v.string()),
  //   email: v.optional(v.string()),
  //   emailVerificationTime: v.optional(v.number()),
  //   /**Custom fields **/
  //   first_name: v.optional(v.string()),
  //   last_name: v.optional(v.string()),
  //   role: v.optional(v.union(v.literal("user"), v.literal("admin"), v.literal("god"))),
  //   status: v.optional(v.union(v.literal("active"), v.literal("inactive"))),
  //   last_login: v.optional(v.number()),
  //   updated_at: v.optional(v.number()),
  // }).index("by_email", ["email"]).index("users_by_role", ["role"]),

  userTable: defineTable({
    auth_id: v.optional(v.string()),
    first_name: v.string(),
    last_name: v.string(),
    email: v.string(),
    role: v.union(v.literal("user"), v.literal("admin"), v.literal("god")),
    updated_at: v.number(),
    last_login: v.optional(v.number()),
    status: v.union(v.literal("active"), v.literal("inactive")),
  }).index("by_email", ["email"])
    .index("users_by_role", ["role"])
    .index("user_by_auth_id", ["auth_id"]),

  // account: defineTable({
  //   user_id: v.id("userTable"),
  //   type: v.string(),
  //   provider: v.string(),
  //   provider_account_id: v.string(),
  //   refresh_token: v.optional(v.string()),
  //   access_token: v.optional(v.string()),
  //   expires_at: v.optional(v.number()),
  //   token_type: v.optional(v.string()),
  //   scope: v.optional(v.string()),
  //   id_token: v.optional(v.string()),
  //   session_state: v.optional(v.string()),
  //   refresh_token_expires_in: v.optional(v.number()),
  //   created_at: v.number(),
  //   updated_at: v.number(),
  // })
  //   .index("by_user_id", ["user_id"])
  //   .index("by_provider_account", ["provider", "provider_account_id"]),

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
    promotion_id: v.optional(v.id("promotion_code")),
    updated_date: v.number(),
  }).index("by_user_id", ["user_id"]),

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
});

