import ClassroomTable from "./_components/classroomTable";
import { api } from "../../../../../convex/_generated/api";
import { fetchQuery } from "convex/nextjs";
import { redirect } from "next/navigation";
import { getToken } from "~/lib/auth-server";
import type { Id } from "../../../../../convex/_generated/dataModel";

export default async function ClassroomPage() {

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
  let classrooms;
  const [courses, orgs] = await Promise.all([
    fetchQuery(api.queries.course.getAllCourses),
    fetchQuery(api.queries.organization.getAllOrganizations)
  ]);
  
  if (isOrgAdmin && orgId) {
    classrooms = await fetchQuery(api.queries.classroom.getClassroomsByOrganization, { 
      org_id: orgId as Id<"organization">, 
      student_counts: true 
    });
  } else {
    classrooms = await fetchQuery(api.queries.classroom.getAllClassroomsWithCourseAndOrgName, { 
      student_counts: true 
    });
  }

  return (
    <>
      <main className="flex min-h-screen flex-col gap-y-6 p-4 sm:p-6 md:p-8 lg:p-12 xl:p-24">
        <h1 className="font-bold text-2xl">CLASSROOMS</h1>
        {classrooms && <ClassroomTable classrooms={classrooms} courses={courses} orgs={orgs} isOrgAdmin={isOrgAdmin} /> }
      </main>
    </>
  )
}