import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { fetchQuery } from "convex/nextjs";
import type { ClassroomStudentData } from "../../_actions/schemas";
import ClassroomStudentTable from "./_components/classroomStudentTable";
import StudentCounts from "./_components/studentCounts";
import AddStudentsButton from "./_components/addStudentsButton";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "~/components/ui/button";

export default async function ClassroomPage(
  props: { 
    params: Promise<{ id: Id<"classroom"> }>
  }
) {
  const params = await props.params;
  const [classroom, students] = await Promise.all([
    fetchQuery(api.queries.classroom.getClassroomById, { id: params.id }),
    fetchQuery(api.queries.student.getStudentsByClassroomId, { classroom_id: params.id })
  ]);
  
  const studentsData = students as ClassroomStudentData[];
  
   return (
    <>
      <main className="flex min-h-screen flex-col gap-y-8 p-24">
        <div className="flex items-center gap-x-2">
          <Link href={`/dashboard/admin/classrooms`} className="flex items-center gap-x-2">
            <Button variant="outline">
              <ArrowLeft className="size-4" />
              <span>Back to Classrooms</span>
            </Button>
          </Link>
        </div>
        <h1 className="font-bold text-2xl">CLASSROOM: {classroom?.classroom_name}</h1>
        <div className="flex items-center justify-between">
          <StudentCounts students={studentsData} />
          {classroom && (
            <AddStudentsButton
              classroomId={params.id}
              courseId={classroom.course_id}
              currentStudentCount={studentsData.length}
            />
          )}
        </div>
        {students.length > 0 && <ClassroomStudentTable students={studentsData} /> }
        {students.length < 1 && <p>NO STUDENTS HERE!</p>}
      </main>
    </>
  );
}