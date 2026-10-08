import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  userTable: defineTable({
    auth_id: v.optional(v.string()),
    first_name: v.string(),
    last_name: v.string(),
    email: v.string(),
    stripe_id: v.optional(v.string()),
    role: v.union(
      v.literal("user"),
      v.literal("admin"),
      v.literal("org_admin"),
      v.literal("god"),
    ),
    org_id: v.optional(v.id("organization")),
    updated_at: v.number(),
    last_login: v.optional(v.number()),
    status: v.union(v.literal("active"), v.literal("inactive")),
  })
    .index("by_email", ["email"])
    .index("users_by_role", ["role"])
    .index("user_by_auth_id", ["auth_id"])
    .index("by_org_id", ["org_id"]),

  session: defineTable({
    sessionId: v.string(),
    user_id: v.id("userTable"),
    role: v.union(
      v.literal("user"),
      v.literal("admin"),
      v.literal("org_admin"),
      v.literal("god"),
    ),
    expires_at: v.number(),
  })
    .index("by_user_id", ["user_id"])
    .index("by_session_id", ["sessionId"]),

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
    status: v.union(
      v.literal("active"),
      v.literal("inactive"),
      v.literal("removed"),
    ),
    cart_id: v.optional(v.id("cart")),
    checkout_attempt_id: v.optional(v.id("monthly_checkout")),
    annual_order_id: v.optional(v.id("full_order")),
  })
    .index("by_username_classroom", ["username", "classroom_id"])
    .index("by_user_id", ["user_id"])
    .index("by_classroom_id", ["classroom_id"])
    .index("by_classroom_status", ["classroom_id", "status"])
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
    .index("by_course", ["course_id"])
    .index("by_classroom_status", ["status"]),

  course: defineTable({
    course_name: v.string(),
    parent_course_id: v.optional(v.id("course")),
    billing_model: v.optional(
      v.union(v.literal("annual_purchase"), v.literal("monthly_subscription")),
    ),
    provisioning_state: v.optional(
      v.union(v.literal("pending"), v.literal("ready"), v.literal("failed")),
    ),
    provisioning_revision: v.optional(v.number()),
    provisioning_error: v.optional(v.string()),
    pending_price: v.optional(v.number()),
    price: v.number(),
    stripe_price_id: v.optional(v.string()),
    stripe_product_id: v.optional(v.string()),
    status: v.union(v.literal("active"), v.literal("inactive")),
  })
    .index("by_course_name", ["course_name"])
    .index("by_stripe_price", ["stripe_price_id"])
    .index("by_provisioning", ["provisioning_state"]),

  organization: defineTable({
    organization_name: v.string(),
    status: v.union(v.literal("active"), v.literal("inactive")),
  }).index("by_organization_name", ["organization_name"]),

  activation_code: defineTable({
    activation_code: v.string(),
    course: v.id("course"),
    organization_id: v.id("organization"),
    order_id: v.optional(v.id("full_order")),
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
    renewal_students: v.optional(v.array(v.id("student"))),
  }).index("by_user_id", ["user_id"]),

  full_order: defineTable({
    cart_id: v.optional(v.id("cart")),
    subscription_id: v.optional(v.id("subscription")),
    stripe_invoice_id: v.optional(v.string()),
    currency: v.optional(v.string()),
    period_start: v.optional(v.number()),
    period_end: v.optional(v.number()),
    purchase_snapshot: v.optional(
      v.array(
        v.object({
          student_id: v.id("student"),
          course_id: v.id("course"),
          course_name: v.optional(v.string()),
          stripe_price_id: v.string(),
          amount: v.number(),
          order_type: v.union(
            v.literal("new"),
            v.literal("renewal"),
            v.literal("reactivation"),
          ),
        }),
      ),
    ),
    user_id: v.id("userTable"),
    total_amount: v.number(),
    stripe_order_id: v.optional(v.string()),
    status: v.optional(
      v.union(
        v.literal("created"),
        v.literal("pending"),
        v.literal("fulfilled"),
        v.literal("canceled"),
      ),
    ),
    promotion_id: v.optional(v.id("promotion_code")),
    updated_date: v.number(),
    order_number: v.optional(v.string()),
  })
    .index("by_user_id", ["user_id"])
    .index("by_stripe_order_id", ["stripe_order_id"])
    .index("by_stripe_invoice", ["stripe_invoice_id"])
    .index("by_subscription", ["subscription_id"])
    .index("by_cart", ["cart_id"])
    .index("by_status", ["status"])
    .index("by_status_date", ["status", "updated_date"])
    .index("by_order_number", ["order_number"]),

  student_order: defineTable({
    course_id: v.optional(v.id("course")),
    course_name: v.optional(v.string()),
    billing_model: v.optional(
      v.union(v.literal("annual_purchase"), v.literal("monthly_subscription")),
    ),
    subscription_id: v.optional(v.id("subscription")),
    period_start: v.optional(v.number()),
    period_end: v.optional(v.number()),
    activation_id: v.optional(v.id("activation_code")),
    amount: v.number(),
    order_id: v.id("full_order"),
    order_type: v.union(
      v.literal("new"),
      v.literal("renewal"),
      v.literal("reactivation"),
    ),
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

  monthly_checkout: defineTable({
    user_id: v.id("userTable"),
    course_id: v.id("course"),
    student_id: v.id("student"),
    stripe_customer_id: v.optional(v.string()),
    stripe_session_id: v.optional(v.string()),
    stripe_price_id: v.string(),
    price: v.number(),
    created_at: v.number(),
    expires_at: v.number(),
    status: v.union(
      v.literal("reserved"),
      v.literal("open"),
      v.literal("completed"),
      v.literal("expired"),
    ),
    error: v.optional(v.string()),
  })
    .index("by_user_course", ["user_id", "course_id"])
    .index("by_course", ["course_id"])
    .index("by_student", ["student_id"])
    .index("by_session", ["stripe_session_id"])
    .index("by_status_expiry", ["status", "expires_at"]),

  subscription: defineTable({
    organization_id: v.optional(v.id("organization")),
    annual_expires_at: v.optional(v.number()),
    renewal_stop_at: v.optional(v.number()),
    cancellation_reason: v.optional(
      v.union(v.literal("member"), v.literal("annual_expiry")),
    ),
    platform_enabled: v.optional(v.boolean()),
    platform_updated_at: v.optional(v.number()),
    activation_required: v.optional(v.boolean()),
    user_id: v.id("userTable"),
    student_id: v.id("student"),
    course_id: v.id("course"),
    checkout_attempt_id: v.id("monthly_checkout"),
    stripe_customer_id: v.string(),
    stripe_subscription_id: v.string(),
    stripe_item_id: v.string(),
    stripe_price_id: v.string(),
    price: v.number(),
    status: v.string(),
    period_start: v.number(),
    period_end: v.number(),
    paid_through: v.number(),
    cancel_at_period_end: v.boolean(),
    cancel_at: v.optional(v.number()),
    canceled_at: v.optional(v.number()),
    ended_at: v.optional(v.number()),
    payment_failed: v.boolean(),
    grace_deadline: v.optional(v.number()),
    access_deadline: v.number(),
    next_reconcile_at: v.number(),
    updated_at: v.number(),
    reconciliation_error: v.optional(v.string()),
  })
    .index("by_course", ["course_id"])
    .index("by_stripe_id", ["stripe_subscription_id"])
    .index("by_organization", ["organization_id"])

    .index("by_activation_required", ["activation_required"])
    .index("by_user", ["user_id"])
    .index("by_student", ["student_id"])

    .index("by_access_deadline", ["access_deadline"])
    .index("by_reconcile", ["next_reconcile_at"])
    .index("by_error", ["reconciliation_error"]),

  subscription_activation: defineTable({
    subscription_id: v.id("subscription"),
    administrator_id: v.id("userTable"),
    enabled: v.boolean(),
    created_at: v.number(),
  }).index("by_subscription", ["subscription_id"]),

  stripe_webhook: defineTable({
    event_id: v.string(),
    event_type: v.string(),
    processed_at: v.number(),
  }).index("by_event", ["event_id"]),

  contact_rate_limit: defineTable({
    key: v.string(),
    window_start: v.number(),
    count: v.number(),
  })
    .index("by_key", ["key"])
    .index("by_window_start", ["window_start"]),
});
