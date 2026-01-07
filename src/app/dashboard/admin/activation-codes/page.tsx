import ActivationCodeTable from "./_components/activationCodeTable";
import { api } from "../../../../../convex/_generated/api";
import { fetchQuery } from "convex/nextjs";
import { redirect } from "next/navigation";
import { getToken } from "~/lib/auth-server";

export default async function ActivationCodePage() {
  const token = await getToken();
  if (!token) redirect("/sign-in");
  
  const user = await fetchQuery(api.auth.getCurrentUser, {}, { token });
  if (!user) redirect("/sign-in");
  
  const allowedRoles = ["admin", "org_admin", "god"];
  if (!allowedRoles.includes(user.role)) redirect("/sign-in");

  // Get user details including org_id for org_admin users
  const userDetails = await fetchQuery(api.queries.users.getUserRoleByAuthId, { userId: user._id });
  const isOrgAdmin = user.role === "org_admin";
  const orgId = isOrgAdmin ? userDetails.org_id : undefined;

  return (
    <>
      <main className="flex min-h-screen flex-col gap-y-8 p-24">
        <h1 className="font-bold text-2xl">ACTIVATION CODES</h1>
        <ActivationCodeTable orgId={orgId} isOrgAdmin={isOrgAdmin} />
      </main>
    </>
  );
}

