import CourseTable from "./_components/courseTable";
import { api } from "~/convex/_generated/api";
import { fetchQuery } from "convex/nextjs";

export default async function CoursePage() {

  const courses = await fetchQuery(api.queries.course.getAllCourses);

  return (
    <>
      <main className="flex min-h-screen flex-col gap-y-8 p-24">
        <h1 className="font-bold text-2xl">COURSES</h1>
        {courses && <CourseTable courses={courses} /> }
      </main>
    </>
  )
}