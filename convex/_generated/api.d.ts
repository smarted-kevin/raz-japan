/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth from "../auth.js";
import type * as authEmail from "../authEmail.js";
import type * as crons from "../crons.js";
import type * as email from "../email.js";
import type * as http from "../http.js";
import type * as lib_auth from "../lib/auth.js";
import type * as lib_authAdminGuard from "../lib/authAdminGuard.js";
import type * as mutations_activation_code from "../mutations/activation_code.js";
import type * as mutations_cart from "../mutations/cart.js";
import type * as mutations_classroom from "../mutations/classroom.js";
import type * as mutations_contact from "../mutations/contact.js";
import type * as mutations_course from "../mutations/course.js";
import type * as mutations_full_order from "../mutations/full_order.js";
import type * as mutations_organization from "../mutations/organization.js";
import type * as mutations_session from "../mutations/session.js";
import type * as mutations_student from "../mutations/student.js";
import type * as mutations_student_order from "../mutations/student_order.js";
import type * as mutations_users from "../mutations/users.js";
import type * as queries_activation_code from "../queries/activation_code.js";
import type * as queries_cart from "../queries/cart.js";
import type * as queries_classroom from "../queries/classroom.js";
import type * as queries_course from "../queries/course.js";
import type * as queries_dashboard from "../queries/dashboard.js";
import type * as queries_full_order from "../queries/full_order.js";
import type * as queries_organization from "../queries/organization.js";
import type * as queries_session from "../queries/session.js";
import type * as queries_student from "../queries/student.js";
import type * as queries_student_order from "../queries/student_order.js";
import type * as queries_users from "../queries/users.js";
import type * as stripe from "../stripe.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  authEmail: typeof authEmail;
  crons: typeof crons;
  email: typeof email;
  http: typeof http;
  "lib/auth": typeof lib_auth;
  "lib/authAdminGuard": typeof lib_authAdminGuard;
  "mutations/activation_code": typeof mutations_activation_code;
  "mutations/cart": typeof mutations_cart;
  "mutations/classroom": typeof mutations_classroom;
  "mutations/contact": typeof mutations_contact;
  "mutations/course": typeof mutations_course;
  "mutations/full_order": typeof mutations_full_order;
  "mutations/organization": typeof mutations_organization;
  "mutations/session": typeof mutations_session;
  "mutations/student": typeof mutations_student;
  "mutations/student_order": typeof mutations_student_order;
  "mutations/users": typeof mutations_users;
  "queries/activation_code": typeof queries_activation_code;
  "queries/cart": typeof queries_cart;
  "queries/classroom": typeof queries_classroom;
  "queries/course": typeof queries_course;
  "queries/dashboard": typeof queries_dashboard;
  "queries/full_order": typeof queries_full_order;
  "queries/organization": typeof queries_organization;
  "queries/session": typeof queries_session;
  "queries/student": typeof queries_student;
  "queries/student_order": typeof queries_student_order;
  "queries/users": typeof queries_users;
  stripe: typeof stripe;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  betterAuth: import("../betterAuth/_generated/component.js").ComponentApi<"betterAuth">;
};
