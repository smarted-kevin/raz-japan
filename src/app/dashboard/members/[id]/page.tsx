
import { fetchQuery } from "convex/nextjs";
import { CirclePlus } from "lucide-react";
import Link from "next/link";
import { Button } from "~/components/ui/button";
import { api } from "../../../../../convex/_generated/api";
import { type Id } from "convex/_generated/dataModel";
import { redirect } from "next/navigation";
import { getToken } from "~/lib/auth-server";
import { MemberStudentTable } from "../_components/memberStudentTable";
import MemberInformation from "./_components/memberInformation";


export default async function MemberPage(
  props: { 
    params: Promise<{ id: string }>
  }
) {
  const token = await getToken();
  const session = await fetchQuery(api.auth.getCurrentUser, {}, {token});

  if (!session) redirect('/sign-in');
  
  const params = await props.params;
  const user = await fetchQuery(api.queries.users.getUserWithStudents, { id: params.id as Id<"userTable"> });

  if (!user || (user.auth_id != session._id )) redirect('/sign-in');

  

  //Get current and removed students as array
  const currentStudents = user.students.filter((student) => student.status === "active");
  const removedStudents = user.students.filter((student) => student.status === "removed");

  return (
    <>
      <MemberInformation
        userId={user.id}
        firstName={user.first_name}
        lastName={user.last_name}
        email={user.email}
      />
      <div className="flex flex-col gap-y-4 mx-12 p-6 border-2 rounded-lg w-2/3">
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
          {currentStudents.length === 0 && 
            <p>No Students Here.</p>
          }
          <MemberStudentTable students={user.students} />
        </div>
      </div>
    </>
  );
}