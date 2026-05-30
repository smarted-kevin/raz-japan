import {
  customCtx,
  customMutation,
  customQuery,
} from "convex-helpers/server/customFunctions";
import { ConvexError } from "convex/values";
import { mutation, query } from "../_generated/server";
import type { Doc } from "../_generated/dataModel";
import type { QueryCtx } from "../_generated/server";

export type Role = "user" | "admin" | "org_admin" | "god";

/**
 * Roles permitted to perform administrative actions.
 * `god` is the superuser; `admin`/`org_admin` are scoped administrators.
 */
export const ADMIN_ROLES: readonly Role[] = ["admin", "org_admin", "god"];

export function isAdminRole(role: Role): boolean {
  return ADMIN_ROLES.includes(role);
}

/**
 * Resolve the currently authenticated application user.
 *
 * Better Auth issues a token whose `subject` matches `userTable.auth_id`,
 * so we look the user up through the `user_by_auth_id` index.
 *
 * Throws (rather than returning null) because every wrapper built on top of
 * this helper requires an authenticated caller.
 */
export async function getAuthenticatedUser(
  ctx: QueryCtx,
): Promise<Doc<"userTable">> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new ConvexError("Not authenticated");
  }

  const user = await ctx.db
    .query("userTable")
    .withIndex("user_by_auth_id", (q) => q.eq("auth_id", identity.subject))
    .first();

  if (!user) {
    throw new ConvexError("User not found");
  }

  return user;
}

async function requireAdmin(ctx: QueryCtx): Promise<Doc<"userTable">> {
  const user = await getAuthenticatedUser(ctx);
  if (!isAdminRole(user.role)) {
    throw new ConvexError("Admin access required");
  }
  return user;
}

/**
 * Query that requires an authenticated user. The resolved `userTable`
 * document is injected as `ctx.user`.
 */
export const authedQuery = customQuery(
  query,
  customCtx(async (ctx) => ({ user: await getAuthenticatedUser(ctx) })),
);

/**
 * Mutation that requires an authenticated user. The resolved `userTable`
 * document is injected as `ctx.user`.
 */
export const authedMutation = customMutation(
  mutation,
  customCtx(async (ctx) => ({ user: await getAuthenticatedUser(ctx) })),
);

/**
 * Query that requires the caller to hold an admin role
 * (`admin`, `org_admin`, or `god`). Injects `ctx.user`.
 */
export const adminQuery = customQuery(
  query,
  customCtx(async (ctx) => ({ user: await requireAdmin(ctx) })),
);

/**
 * Mutation that requires the caller to hold an admin role
 * (`admin`, `org_admin`, or `god`). Injects `ctx.user`.
 */
export const adminMutation = customMutation(
  mutation,
  customCtx(async (ctx) => ({ user: await requireAdmin(ctx) })),
);
