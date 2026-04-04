"use client";

import { useTranslations } from "next-intl";
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

export function MemberStudentTable({ students }: { students: StudentData[] }) {
  const t = useTranslations("dashboard.members");
  return (
    <>
      {/* Mobile: Card layout */}
      <div className="flex flex-col gap-3 md:hidden">
        {students.map((student) => (
          <MemberStudentCard key={student.id} student={student} />
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
              <TableHead>{t("actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.map((student) => (
              <MemberStudentRow key={student.id} student={student} />
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}