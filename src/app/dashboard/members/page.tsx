import { fetchQuery } from "convex/nextjs";
import { CirclePlus, GraduationCap, Clock } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "~/components/ui/button";
import { api } from "@/convex/_generated/api";
import { redirect } from "next/navigation";
import { getMemberSession } from "~/lib/member-session";
import { MemberStudentTable } from "./_components/memberStudentTable";
import MemberInformation from "./_components/memberInformation";
import ActivateStudentByCode from "./_components/activateStudentByCode";
import { Card, CardContent, CardHeader } from "~/components/ui/card";
import { getTranslations } from "next-intl/server";
import { isRenewable } from "~/lib/dateCompare";

export default async function MemberPage() {
  const { token, session, memberId } = await getMemberSession();

  const user = await fetchQuery(api.queries.users.getUserWithStudents, {
    id: memberId,
  }, { token });

  if (!user || user.auth_id != session._id) redirect("/sign-in");

  const currentStudents = user.students.filter(
    (student) => student.status === "active"
  );
  const removedStudents = user.students.filter(
    (student) => student.status === "removed"
  );
  // Capture one request-time timestamp in this server component for all client rows.
  // eslint-disable-next-line react-hooks/purity
  const renderedAt = Date.now();

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
        <Link
          href={"/dashboard/members/order"}
          className={buttonVariants({
            className:
              "h-[3.15rem] gap-2.5 px-7 text-[0.9rem] has-[>svg]:px-7",
          })}
        >
          {t(user.students.some((student) => isRenewable(60, student.expiry_date, renderedAt)) ? "add_or_renew_students" : "add_students")}
          <CirclePlus className="size-[1.35rem]" />
        </Link>
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
              <Link
                href={"/dashboard/members/order"}
                className={buttonVariants({
                  variant: "outline",
                  className: "mt-4",
                })}
              >
                {t("add_first_student")}
                <CirclePlus className="ml-2 h-4 w-4" />
              </Link>
            </div>
          ) : (
            <MemberStudentTable
              students={currentStudents}
              renderedAt={renderedAt}
            />
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
            <MemberStudentTable
              students={removedStudents}
              renderedAt={renderedAt}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
