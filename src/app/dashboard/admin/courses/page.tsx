import CourseTable from "./_components/courseTable";
import { api } from "../../../../../convex/_generated/api";
import { fetchQuery } from "convex/nextjs";
import { getTranslations } from "next-intl/server";

export default async function CoursePage() {

  const courses = await fetchQuery(api.queries.course.getAllCourses);
  const t = await getTranslations("dashboard.admin.courses");

  return (
    <>
      <main className="flex min-h-screen flex-col gap-y-6 p-4 sm:p-6 md:p-8 lg:p-12 xl:p-24">
        <h1 className="font-bold text-2xl">{t("title")}</h1>
        {courses && <CourseTable courses={courses} /> }
      </main>
    </>
  )
}