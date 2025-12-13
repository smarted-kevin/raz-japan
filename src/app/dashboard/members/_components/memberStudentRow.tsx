"use client";

import { TableCell, TableRow } from "~/components/ui/table";
import { dateDisplayFormat } from "~/lib/formatters";
import type { StudentData } from "../../admin/_actions/schemas";

export function MemberStudentRow({ student }:{student:StudentData}) {

  return (
    <TableRow>
      <TableCell>{student.username}</TableCell>
      <TableCell>{student.password}</TableCell>
      <TableCell>{student.classroom_name}</TableCell>
      <TableCell>{dateDisplayFormat(student.expiry_date) ?? ""}</TableCell>
      <TableCell>{student.status}</TableCell>
    </TableRow>
  );
}