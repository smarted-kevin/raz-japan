import { fetchQuery } from "convex/nextjs";
import { CirclePlus, GraduationCap, Clock } from "lucide-react";
import Link from "next/link";
import { Button } from "~/components/ui/button";
import { api } from "../../../../../convex/_generated/api";
import { type Id } from "convex/_generated/dataModel";
import { redirect } from "next/navigation";
import { getToken } from "~/lib/auth-server";
import { MemberStudentTable } from "../_components/memberStudentTable";
import MemberInformation from "./_components/memberInformation";
import ActivateStudentByCode from "./_components/activateStudentByCode";
import { Card, CardContent, CardHeader } from "~/components/ui/card";

export default async function MemberPage(
  props: {
    params: Promise<{ id: string }>;
  }
) {
  const token = await getToken();
  const session = await fetchQuery(api.auth.getCurrentUser, {}, { token });

  if (!session) redirect("/sign-in");

  const params = await props.params;
  const user = await fetchQuery(api.queries.users.getUserWithStudents, {
    id: params.id as Id<"userTable">,
  });

  if (!user || user.auth_id != session._id) redirect("/sign-in");

  const currentStudents = user.students.filter(
    (student) => student.status === "active"
  );
  const removedStudents = user.students.filter(
    (student) => student.status === "removed"
  );

  return (
    <div className="flex flex-col gap-6">
      <MemberInformation
        userId={user.id}
        firstName={user.first_name ?? ""}
        lastName={user.last_name ?? ""}
        email={user.email ?? ""}
      />
      <ActivateStudentByCode userId={user.id} />
      <Card className="w-full max-w-4xl overflow-hidden">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <GraduationCap className="h-5 w-5 text-primary" aria-hidden />
            </div>
            <h2 className="text-lg font-semibold">Current Students</h2>
          </div>
          <Button asChild className="w-full gap-2 sm:w-auto">
            <Link href={`order/${user.id}`}>
              Add Students
              <CirclePlus className="h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {currentStudents.length === 0 ? (
            <div className="rounded-lg border border-dashed py-12 text-center">
              <p className="text-muted-foreground">No students yet.</p>
              <Button variant="outline" className="mt-4" asChild>
                <Link href={`order/${user.id}`}>
                  Add your first student
                  <CirclePlus className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          ) : (
            <MemberStudentTable students={currentStudents} />
          )}
        </CardContent>
      </Card>
      {removedStudents.length > 0 && (
        <Card className="w-full max-w-4xl overflow-hidden">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
                <Clock className="h-5 w-5 text-muted-foreground" aria-hidden />
              </div>
              <h2 className="text-lg font-semibold">Expired Students</h2>
            </div>
          </CardHeader>
          <CardContent>
            <MemberStudentTable students={removedStudents} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}