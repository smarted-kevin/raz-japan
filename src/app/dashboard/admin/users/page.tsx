import UserTable from "./_components/userTable";
import { api } from "~/convex/_generated/api";
import { fetchQuery } from "convex/nextjs";

export default async function StudentsPage() {

  const users = await fetchQuery(api.queries.user.getUsersWithStudents, {})

  return (
    <>
      <main className="flex min-h-screen flex-col gap-y-8 p-24">
        <h1 className="font-bold text-2xl">USERS</h1>
        {users && <UserTable users={users} /> }
      </main>
    </>
  )
}