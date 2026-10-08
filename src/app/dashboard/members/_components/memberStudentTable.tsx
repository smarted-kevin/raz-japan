"use client";

import { useQuery } from "convex/react";
import { useTranslations } from "next-intl";
import { api } from "@/convex/_generated/api";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import type { StudentData } from "../../admin/_actions/schemas";
import { MemberStudentRow } from "./memberStudentRow";
import { MemberStudentCard } from "./memberStudentCard";

export function MemberStudentTable({
  students,
  renderedAt,
  showMonthlySubscription = false,
}: {
  students: StudentData[];
  renderedAt: number;
  showMonthlySubscription?: boolean;
}) {
  const t = useTranslations("dashboard.members");
  const billing = useQuery(
    api.billingStore.memberBilling,
    showMonthlySubscription ? {} : "skip",
  );
  return (
    <>
      {/* Mobile: Card layout */}
      <div className="flex flex-col gap-3 md:hidden">
        {students.map((student) => (
          <MemberStudentCard
            key={student.id}
            student={student}
            renderedAt={renderedAt}
            billing={billing}
            showMonthlySubscription={showMonthlySubscription}
          />
        ))}
      </div>

      {/* Desktop: Table layout */}
      <div className="hidden md:block">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>{t("student_username")}</TableHead>
              <TableHead>{t("password")}</TableHead>
              <TableHead>{t("classroom")}</TableHead>
              <TableHead>{t("expiry_date")}</TableHead>
              <TableHead>{t("status")}</TableHead>
              {showMonthlySubscription && (
                <TableHead>{t("monthly_subscription")}</TableHead>
              )}
              <TableHead>{t("actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.map((student) => (
              <MemberStudentRow
                key={student.id}
                student={student}
                renderedAt={renderedAt}
                billing={billing}
                showMonthlySubscription={showMonthlySubscription}
              />
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
