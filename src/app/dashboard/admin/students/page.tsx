import StudentTable from "./_components/studentTable";
import { api } from "../../../../../convex/_generated/api";
import { fetchQuery } from "convex/nextjs";
import { redirect } from "next/navigation";
import { getToken } from "~/lib/auth-server";
import type { Id } from "../../../../../convex/_generated/dataModel";

export default async function StudentsPage() {

  const token = await getToken();
  if (!token) redirect("/sign-in");
  
  const user = await fetchQuery(api.auth.getCurrentUser, {}, { token });
  if (!user) redirect("/sign-in");
  
  const allowedRoles = ["admin", "org_admin", "god"];
  if (!allowedRoles.includes(user.role)) redirect("/sign-in");

  // Get user details including org_id for org_admin users
  const userDetails = await fetchQuery(api.queries.users.getUserRoleByAuthId, { userId: user._id });
  const isOrgAdmin = user.role === "org_admin";
  const orgId = userDetails.org_id;

  // Fetch data based on role - org_admin only sees their organization's data
  let students;
  let classrooms;
  
  if (isOrgAdmin && orgId) {
    [students, classrooms] = await Promise.all([
      fetchQuery(api.queries.student.getStudentsByOrganization, { org_id: orgId as Id<"organization"> }),
      fetchQuery(api.queries.classroom.getClassroomsByOrganization, { org_id: orgId as Id<"organization"> })
    ]);
  } else {
    [students, classrooms] = await Promise.all([
      fetchQuery(api.queries.student.getAllStudentsWithClassroomAndUser, {}),
      fetchQuery(api.queries.classroom.getAllClassroomsWithCourseAndOrgName, {})
    ]);
  }

  return (
    <>
      <main className="flex min-h-screen flex-col gap-y-8 pt-8">
        <h1 className="font-bold text-2xl">Students</h1>
        <StudentTable students={students} classrooms={classrooms} />
      </main>
    </>
  )
}