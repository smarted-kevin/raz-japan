"use client";

import { TableCell, TableRow } from "~/components/ui/table";
import { dateDisplayFormat } from "~/lib/formatters";
import type { StudentData } from "../../admin/_actions/schemas";
import { ExtendStudentByCode } from "./extendStudentByCode";

// Check if expiry date is within 60 days from now
function isExpiryWithin60Days(expiryDate: number | undefined): boolean {
  if (!expiryDate) return false;
  const now = Date.now();
  const sixtyDaysInMs = 60 * 24 * 60 * 60 * 1000;
  return expiryDate - now <= sixtyDaysInMs;
}

export function MemberStudentRow({ student }:{student:StudentData}) {
  const showExtendButton = student.status === "active" && isExpiryWithin60Days(student.expiry_date);

  return (
    <TableRow>
      <TableCell>{student.username}</TableCell>
      <TableCell>{student.password}</TableCell>
      <TableCell>{student.classroom_name}</TableCell>
      <TableCell>{dateDisplayFormat(student.expiry_date) ?? ""}</TableCell>
      <TableCell>{student.status}</TableCell>
      <TableCell>
        {showExtendButton && (
          <ExtendStudentByCode
            studentId={student.id}
            studentUsername={student.username}
          />
        )}
      </TableCell>
    </TableRow>
  );
}