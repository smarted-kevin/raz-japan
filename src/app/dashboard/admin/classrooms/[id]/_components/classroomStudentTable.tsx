"use client";

import { useTranslations } from "next-intl";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import type { ClassroomStudentData } from "../../../_actions/schemas";
import { dateDisplayFormat } from "~/lib/formatters";
import { useAdminStatusLabel } from "../../../_lib/useAdminStatusLabel";

export default function ClassroomStudentTable({
  students,
}: {
  students: ClassroomStudentData[];
}) {
  const tc = useTranslations("dashboard.admin.common");
  const statusLabel = useAdminStatusLabel();

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{tc("username")}</TableHead>
          <TableHead>{tc("password")}</TableHead>
          <TableHead>{tc("expiry_date")}</TableHead>
          <TableHead>{tc("status")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {students.map((student) => (
          <TableRow key={student.id}>
            <TableCell>{student.username}</TableCell>
            <TableCell>{student.password}</TableCell>
            <TableCell>{dateDisplayFormat(student.expiry_date) ?? ""}</TableCell>
            <TableCell>{statusLabel(student.status)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
