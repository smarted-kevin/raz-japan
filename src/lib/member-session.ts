import "server-only";
import { fetchQuery } from "convex/nextjs";
import { redirect } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { getToken } from "~/lib/auth-server";

/** Resolve the member from the authenticated session, never from a URL. */
export async function getMemberSession() {
  const token = await getToken();
  if (!token) redirect("/sign-in");
  const session = await fetchQuery(api.auth.getCurrentUser, {}, { token });
  if (!session) redirect("/sign-in");
  const member = await fetchQuery(
    api.queries.users.getUserRoleByAuthId,
    { userId: session._id },
    { token },
  );
  if (!member) redirect("/sign-in");
  return { token, session, memberId: member.user_id };
}
