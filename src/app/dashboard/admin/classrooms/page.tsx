import ClassroomTable from "./_components/classroomTable";
import { api } from "~/convex/_generated/api";
import { fetchQuery } from "convex/nextjs";

export default async function ClassroomPage() {

  const classrooms = await fetchQuery(
    api.queries.classroom.getAllClassroomsWithCourseAndOrgName, 
    { student_counts: true }
  );

  return (
    <>
      <main className="flex min-h-screen flex-col gap-y-8 p-24">
        <h1 className="font-bold text-2xl">CLASSROOMS</h1>
        {classrooms && <ClassroomTable classrooms={classrooms} /> }
      </main>
    </>
  )
}