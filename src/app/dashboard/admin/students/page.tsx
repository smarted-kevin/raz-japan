import StudentTable from "./_components/studentTable";
import { api } from "convex/_generated/api";
import { fetchQuery } from "convex/nextjs";
import { redirect } from "next/navigation";
import { getToken } from "~/lib/auth-server";

export default async function StudentsPage() {

  const token = await getToken();
  if (!token) redirect("/sign-in");
  if (token) {
    const user = await fetchQuery(api.auth.getCurrentUser, {}, {token});
    if (!user || user.role != "admin") redirect("/sign-in");
  }

  const [students, classrooms] = await Promise.all([
    fetchQuery(api.queries.student.getAllStudentsWithClassroomAndUser, {}),
    fetchQuery(api.queries.classroom.getAllClassroomsWithCourseAndOrgName, {})
  ]);

  return (
    <>
      <main className="flex min-h-screen flex-col gap-y-8 pt-8">
        <h1 className="font-bold text-2xl">Students</h1>
        {students.length > 0 && <StudentTable students={students} classrooms={classrooms} /> }
        {students.length < 1 && <p>NO STUDENTS HERE!</p>}
      </main>
    </>
  )
}