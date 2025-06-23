/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as mutations_classroom from "../mutations/classroom.js";
import type * as mutations_course from "../mutations/course.js";
import type * as mutations_full_order from "../mutations/full_order.js";
import type * as mutations_organization from "../mutations/organization.js";
import type * as mutations_session from "../mutations/session.js";
import type * as mutations_student from "../mutations/student.js";
import type * as mutations_student_order from "../mutations/student_order.js";
import type * as mutations_user from "../mutations/user.js";
import type * as queries_cart from "../queries/cart.js";
import type * as queries_classroom from "../queries/classroom.js";
import type * as queries_course from "../queries/course.js";
import type * as queries_full_order from "../queries/full_order.js";
import type * as queries_organization from "../queries/organization.js";
import type * as queries_session from "../queries/session.js";
import type * as queries_student from "../queries/student.js";
import type * as queries_student_order from "../queries/student_order.js";
import type * as queries_user from "../queries/user.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  "mutations/classroom": typeof mutations_classroom;
  "mutations/course": typeof mutations_course;
  "mutations/full_order": typeof mutations_full_order;
  "mutations/organization": typeof mutations_organization;
  "mutations/session": typeof mutations_session;
  "mutations/student": typeof mutations_student;
  "mutations/student_order": typeof mutations_student_order;
  "mutations/user": typeof mutations_user;
  "queries/cart": typeof queries_cart;
  "queries/classroom": typeof queries_classroom;
  "queries/course": typeof queries_course;
  "queries/full_order": typeof queries_full_order;
  "queries/organization": typeof queries_organization;
  "queries/session": typeof queries_session;
  "queries/student": typeof queries_student;
  "queries/student_order": typeof queries_student_order;
  "queries/user": typeof queries_user;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
