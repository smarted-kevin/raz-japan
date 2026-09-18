import { APIError, createAuthMiddleware, getSessionFromCtx } from "better-auth/api";

function hasGodRole(user: unknown): boolean {
  if (!user || typeof user !== "object" || !("role" in user)) return false;
  return typeof user.role === "string" && user.role.split(",").includes("god");
}

/** Protect superusers on Better Auth's HTTP API as well as the Convex API. */
export const createAuthAdminGuard = (getGodAuthIds: () => Promise<string[]>) => createAuthMiddleware(async (ctx) => {
  if (!ctx.path?.startsWith("/admin/")) return;

  const session = await getSessionFromCtx(ctx);
  if (!session) return;
  const godAuthIds = await getGodAuthIds();
  if (godAuthIds.includes(session.user.id)) return;

  const deny = () => {
    throw new APIError("FORBIDDEN", { message: "User access denied" });
  };
  const adapter = ctx.context.internalAdapter;
  const targetId = ctx.body?.userId ?? ctx.query?.userId ?? ctx.query?.id;
  if (typeof targetId === "string") {
    const target = await adapter.findUserById(targetId);
    if (godAuthIds.includes(targetId) || hasGodRole(target)) deny();
  }
  if (typeof ctx.body?.sessionToken === "string") {
    const targetSession = await adapter.findSession(ctx.body.sessionToken);
    if (targetSession && (godAuthIds.includes(targetSession.user.id) || hasGodRole(targetSession.user))) deny();
  }

  // Prevent promoting an accessible account and then using it to bypass the guard.
  for (const role of [ctx.body?.role, ctx.body?.data?.role]) {
    const roles = Array.isArray(role) ? role : typeof role === "string" ? role.split(",") : [];
    if (roles.includes("god")) deny();
  }

  if (ctx.path === "/admin/list-users") {
    // Apply the restriction before pagination and counting, preserving search filters.
    const excludeGod = { field: "role", operator: "ne" as const, value: "god" };
    const restrictions = [excludeGod, ...godAuthIds.map((id) => ({
      field: "id", operator: "ne" as const, value: id,
    }))];
    return {
      context: {
        internalAdapter: {
          ...adapter,
          listUsers: (limit, offset, sortBy, where) =>
            adapter.listUsers(limit, offset, sortBy, [...(where ?? []), ...restrictions]),
          countTotalUsers: (where) =>
            adapter.countTotalUsers([...(where ?? []), ...restrictions]),
        } satisfies typeof adapter,
      },
    };
  }
});
