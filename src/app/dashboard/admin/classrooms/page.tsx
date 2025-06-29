import ClassroomTable from "./_components/classroomTable";
import { api } from "~/convex/_generated/api";
import { fetchQuery } from "convex/nextjs";

export default async function ClassroomPage() {

  const [classrooms, courses, orgs] = await Promise.all([
    fetchQuery(api.queries.classroom.getAllClassroomsWithCourseAndOrgName, 
      { student_counts: true }
    ),
    fetchQuery(api.queries.course.getAllCourses),
    fetchQuery(api.queries.organization.getAllOrganizations)
  ]);

  return (
    <>
      <main className="flex min-h-screen flex-col gap-y-8 p-24">
        <h1 className="font-bold text-2xl">CLASSROOMS</h1>
        {classrooms && <ClassroomTable classrooms={classrooms} courses={courses} orgs={orgs} /> }
      </main>
    </>
  )
}