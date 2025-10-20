import { getServerSession } from "~/lib/get-session";
import SignIn from "./SignIn";
import type { User } from "convex/auth";
import { redirect } from "next/navigation";
import { fetchQuery } from "convex/nextjs";
import { api } from "../../../../convex/_generated/api";
import { getToken } from "~/lib/auth-server";

export default async function SignInPage() {

  const token = await getToken();
  if (token) {
    const user = await fetchQuery(api.auth.getCurrentUser,{},{token});
  
    console.log({
       ...user,
       createdAt: new Date(user.createdAt),
    });
  
    if (token && user.role == "admin") {
      redirect("/dashboard");
    }
    if (user && user.role == "user") {
      const userTableUser = await fetchQuery(api.queries.users.getUserRoleByAuthId, { userId: user._id });
      if (userTableUser) {
        redirect(`/dashboard/members/${userTableUser.user_id}`);
      }
    }
  }

  return (
    <div className="flex justify-center items-center my-8 min-w-screen">
      <SignIn />
    </div>
  );
}