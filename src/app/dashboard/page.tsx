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
  
    if (token && user.role == "admin") {
      console.log("HERE");
      redirect("/dashboard/admin");
    }
    if (user && user.role == "user") {
      console.log("THERE");
      const userTableUser = await fetchQuery(api.queries.users.getUserRoleByAuthId, { userId: user._id });
      if (userTableUser) {
        redirect(`/dashboard/members/${userTableUser.user_id}`);
      }
    }
  }

  return
  <></>
}