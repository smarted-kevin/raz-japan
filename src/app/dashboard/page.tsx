import { redirect } from "next/navigation";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { getToken } from "~/lib/auth-server";

export default async function DashboardPage() {

  const token = await getToken();
  if (!token) redirect("/sign-in");
  if (token) {
    const user = await fetchQuery(api.auth.getCurrentUser,{},{token});
  
    console.log(user);
  
    // Redirect admin, org_admin, and god users to admin dashboard
    if (token && (user.role == "admin" || user.role == "org_admin" || user.role == "god")) {
      redirect("/dashboard/admin");
    }
    if (user && user.role == "user") {
      const userTableUser = await fetchQuery(api.queries.users.getUserRoleByAuthId, { userId: user._id });
      if (userTableUser) {
        redirect(`${process.env.SITE_URL ?? "http://localhost:3000"}/dashboard/members/${userTableUser.user_id}`);
      }
    }
  }

  return
  <></>
}