import TopNav from "./_components/navBar";
import { redirect } from "next/navigation";
import { getToken } from "~/lib/auth-server";
import { fetchQuery } from "convex/nextjs";
import { api } from "convex/_generated/api";

type UserRole = "user" | "admin" | "org_admin" | "god";

export default async function AdminLayout({ 
  children 
}: Readonly<{ children: React.ReactNode }> 
) {
  const token = await getToken();
  if (!token) redirect("/sign-in");

  const user = await fetchQuery(api.auth.getCurrentUser, {}, { token });
  if (!user) redirect("/sign-in");

  const allowedRoles: UserRole[] = ["admin", "org_admin", "god"];
  const userRole = user.role as UserRole;
  
  if (!allowedRoles.includes(userRole)) {
    redirect("/sign-in");
  }

  return (
      <>
        <TopNav role={userRole} />
        <div className="container mx-auto pt-4">{ children }</div>
      </>

  )
}