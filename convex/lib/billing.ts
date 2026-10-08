import type { Doc, Id } from "../_generated/dataModel";
import type { QueryCtx } from "../_generated/server";
import { v } from "convex/values";

export const billingModel = v.union(
  v.literal("annual_purchase"),
  v.literal("monthly_subscription"),
);
export const GRACE_MS = 7 * 24 * 60 * 60 * 1000;
export const DAY_MS = 24 * 60 * 60 * 1000;

export function nextMonthlyBoundary(timestamp: number) {
  const date = new Date(timestamp);
  const month = date.getUTCMonth() + 1;
  const lastDay = new Date(
    Date.UTC(date.getUTCFullYear(), month + 1, 0),
  ).getUTCDate();
  return Date.UTC(
    date.getUTCFullYear(),
    month,
    Math.min(date.getUTCDate(), lastDay),
    date.getUTCHours(),
    date.getUTCMinutes(),
    date.getUTCSeconds(),
  );
}

export function validatePrice(price: number) {
  if (!Number.isSafeInteger(price) || price <= 0)
    throw new Error("Price must be a positive integer in JPY");
}

export function isAnnual(course: Pick<Doc<"course">, "billing_model">) {
  return (course.billing_model ?? "annual_purchase") === "annual_purchase";
}

export function accessDeadline(
  subscription: Pick<
    Doc<"subscription">,
    | "paid_through"
    | "payment_failed"
    | "cancel_at_period_end"
    | "cancel_at"
    | "status"
    | "grace_deadline"
    | "cancellation_reason"
    | "annual_expires_at"
  >,
) {
  if (!subscription.paid_through) return 0;
  if (
    subscription.cancel_at_period_end ||
    (subscription.cancel_at &&
      subscription.cancellation_reason !== "annual_expiry") ||
    subscription.status === "canceled"
  )
    return subscription.paid_through;
  return subscription.payment_failed
    ? Math.max(
        subscription.paid_through,
        Math.min(
          subscription.grace_deadline ?? 0,
          subscription.annual_expires_at ?? Infinity,
        ),
      )
    : subscription.paid_through;
}

/** Last full monthly period may extend beyond annual expiry; never prorate it. */
export function renewalStopAt(
  anchorSeconds: number,
  periodEndSeconds: number,
  annualExpiry: number,
) {
  const anchor = new Date(anchorSeconds * 1000);
  let end = periodEndSeconds * 1000;
  for (let months = 0; end < annualExpiry && months < 1200; months++) {
    const previous = new Date(end);
    const year = previous.getUTCFullYear();
    const month = previous.getUTCMonth() + 1;
    const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    end = Date.UTC(
      year,
      month,
      Math.min(anchor.getUTCDate(), lastDay),
      anchor.getUTCHours(),
      anchor.getUTCMinutes(),
      anchor.getUTCSeconds(),
    );
  }
  if (end < annualExpiry)
    throw new Error("Annual expiry exceeds supported billing horizon");
  return end;
}

export function blocksAddon(
  subscription: Doc<"subscription">,
  now = Date.now(),
) {
  return (
    !["canceled", "incomplete_expired"].includes(subscription.status) ||
    accessDeadline(subscription) > now ||
    subscription.platform_enabled === true
  );
}

export async function requireNoAddon(
  ctx: Pick<QueryCtx, "db">,
  studentId: Id<"student">,
) {
  const subscriptions = await ctx.db
    .query("subscription")
    .withIndex("by_student", (q) => q.eq("student_id", studentId))
    .collect();
  const attempts = await ctx.db
    .query("monthly_checkout")
    .withIndex("by_student", (q) => q.eq("student_id", studentId))
    .collect();
  if (
    subscriptions.some((s) => blocksAddon(s)) ||
    attempts.some((a) => a.status === "open" || a.status === "reserved")
  )
    throw new Error(
      "End the add-on, wait for paid access to expire, and acknowledge platform deactivation before changing this student",
    );
}

export async function studentCourse(
  ctx: Pick<QueryCtx, "db">,
  student: Pick<Doc<"student">, "classroom_id" | "course_id">,
) {
  const classroom = student.classroom_id
    ? await ctx.db.get(student.classroom_id)
    : null;
  const courseId = classroom?.course_id ?? student.course_id;
  return courseId ? ctx.db.get(courseId) : null;
}

export async function requireAnnualStudent(
  ctx: Pick<QueryCtx, "db">,
  student: Doc<"student">,
) {
  if (student.checkout_attempt_id || student.annual_order_id)
    throw new Error("Student has a pending checkout");
  const course = await studentCourse(ctx, student);
  if (course && !isAnnual(course))
    throw new Error("Monthly students cannot use annual activation or renewal");
}

export async function availableStudents(
  ctx: Pick<QueryCtx, "db">,
  courseId: Id<"course">,
) {
  const classrooms = await ctx.db
    .query("classroom")
    .withIndex("by_course", (q) => q.eq("course_id", courseId))
    .collect();
  const result: Doc<"student">[] = [];
  for (const classroom of classrooms) {
    if (classroom.status !== "active") continue;
    const students = await ctx.db
      .query("student")
      .withIndex("by_classroom_status", (q) =>
        q.eq("classroom_id", classroom._id).eq("status", "inactive"),
      )
      .collect();
    result.push(
      ...students.filter(
        (s) => !s.user_id && !s.checkout_attempt_id && !s.annual_order_id,
      ),
    );
  }
  return result;
}
