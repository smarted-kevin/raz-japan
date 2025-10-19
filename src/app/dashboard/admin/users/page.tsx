import UserTable from "./_components/userTable";
import { api } from "convex/_generated/api";
import { fetchQuery } from "convex/nextjs";
import { redirect } from "next/navigation";
import { getToken } from "~/lib/auth-server";

export default async function UsersPage() {

  const token = await getToken();
  if (!token) redirect("/sign-in");
  if (token) {
    const user = await fetchQuery(api.auth.getCurrentUser, {}, {token});
    if (!user || user.role != "admin") redirect("/sign-in");
  }

  const users = await fetchQuery(api.queries.users.getUsersWithStudents);



  return (
    <>
      <main className="flex min-h-screen flex-col gap-y-8 p-24">
        <h1 className="font-bold text-2xl">USERS</h1>
        {users && <UserTable users={users} /> }
      </main>
    </>
  )
}