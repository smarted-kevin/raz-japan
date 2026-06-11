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
import { getTranslations } from "next-intl/server";

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

  const t = await getTranslations("dashboard.members");

  return (
    <div className="flex flex-col gap-6">
      <MemberInformation
        userId={user.id}
        firstName={user.first_name ?? ""}
        lastName={user.last_name ?? ""}
        email={user.email ?? ""}
      />
      <div className="w-full max-w-4xl">
        <Button
          asChild
          className="h-[3.15rem] gap-2.5 px-7 text-[0.9rem] has-[>svg]:px-7"
        >
          <Link href={`order/${user.id}`}>
            {t("add_students")}
            <CirclePlus className="size-[1.35rem]" />
          </Link>
        </Button>
      </div>
      <Card className="w-full max-w-4xl overflow-hidden">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <GraduationCap className="h-5 w-5 text-primary" aria-hidden />
            </div>
            <h2 className="text-lg font-semibold">{t("current_students")}</h2>
          </div>
        </CardHeader>
        <CardContent>
          {currentStudents.length === 0 ? (
            <div className="rounded-lg border border-dashed py-12 text-center">
              <p className="text-muted-foreground">{t("no_students_yet")}</p>
              <Button variant="outline" className="mt-4" asChild>
                <Link href={`order/${user.id}`}>
                  {t("add_first_student")}
                  <CirclePlus className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          ) : (
            <MemberStudentTable students={currentStudents} />
          )}
        </CardContent>
      </Card>
      <ActivateStudentByCode userId={user.id} />
      {removedStudents.length > 0 && (
        <Card className="w-full max-w-4xl overflow-hidden">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
                <Clock className="h-5 w-5 text-muted-foreground" aria-hidden />
              </div>
              <h2 className="text-lg font-semibold">{t("expired_students")}</h2>
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