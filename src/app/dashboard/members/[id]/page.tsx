import { fetchQuery } from "convex/nextjs";
import { CirclePlus } from "lucide-react";
import Link from "next/link";
import { Button } from "~/components/ui/button";
import { api } from "~/convex/_generated/api";
import { type Id } from "~/convex/_generated/dataModel";
import { redirect } from "next/navigation";


export default async function MemberPage({ 
  params 
}: { 
  params: { id: string }
}) {
  const user = await fetchQuery(api.queries.user.getUserWithStudents, { id: params.id as Id<"user"> });

  if (!user) redirect('/sign-in');

  //Get current and removed students as array
  const currentStudents = user.students.filter((student) => student.status === "active");
  const removedStudents = user.students.filter((student) => student.status === "removed");

  return (
    <>
      <div className="flex flex-col gap-y-12 mx-20">
        <div className="flex gap-x-4">
          <h1 className="text-xl font-bold">Member Information</h1>
          
        </div>
      </div>
      <div className="flex flex-col gap-y-4">
        <div className="flex gap-x-8">
          <p>Name:</p>
          <p>{user?.first_name} {user?.last_name}</p>
        </div>
        <div className="flex gap-x-8">
          <p>Email:</p>
          <p>{user?.email}</p>
        </div>
      </div>
      <div className="flex flex-col gap-y-12">
        <div className="flex flex-col gap-y-8">
          <div className="flex gap-x-8 items-center">
            <h2 className="font-bold text-lg">Current Students</h2>
            <Button className="flex gap-x-4" asChild>
              <Link href={`order/${user?.id}`}>
                Add Students
                <CirclePlus />
              </Link>
            </Button>
          </div>
          {/** current students loop end **/}
          {currentStudents.length === 0 && 
            <p>No Students Here.</p>
          }
          {currentStudents.length > 0 && currentStudents.map((student) => (
            <div key={student.id}>
              <p>Student Username: {student.username}</p>
            </div>
          ))}
          {/** current students loop end **/}
        </div>
        {/** removed students loop start **/}
        <div className="flex flex-col gap-y-8">
          <h2 className="font-bold text-lg">Expired or Removed Students</h2>
          {removedStudents.length === 0 && 
            <p>No Students Here.</p>
          }
          {removedStudents.length > 0 && removedStudents.map((student) => (
            <div key={student.id}>
              <p>Student Username: {student.username}</p>
            </div>
          ))}
        </div> 
        {/** removed students loop end **/}
      </div>
    </>
  );
}