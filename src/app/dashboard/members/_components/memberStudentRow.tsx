"use client";

import { useTranslations } from "next-intl";
import { TableCell, TableRow } from "~/components/ui/table";
import { dateDisplayFormat } from "~/lib/formatters";
import type { StudentData } from "../../admin/_actions/schemas";
import { ExtendStudentByCode } from "./extendStudentByCode";
import {
  MonthlySubscriptionCell,
  type MemberBillingData,
} from "./monthlySubscriptionCell";

// Check if expiry date is within 60 days from now
function isExpiryWithin60Days(
  expiryDate: number | undefined,
  renderedAt: number,
): boolean {
  if (!expiryDate) return false;
  const sixtyDaysInMs = 60 * 24 * 60 * 60 * 1000;
  return expiryDate - renderedAt <= sixtyDaysInMs;
}

export function MemberStudentRow({
  student,
  renderedAt,
  billing,
  showMonthlySubscription = false,
}: {
  student: StudentData;
  renderedAt: number;
  billing: MemberBillingData | undefined;
  showMonthlySubscription?: boolean;
}) {
  const tb = useTranslations("billing");
  const showExtendButton =
    student.status === "active" &&
    isExpiryWithin60Days(student.expiry_date, renderedAt);

  return (
    <TableRow>
      <TableCell>{student.username}</TableCell>
      <TableCell>{student.password}</TableCell>
      <TableCell>{student.classroom_name}</TableCell>
      <TableCell>{dateDisplayFormat(student.expiry_date) ?? ""}</TableCell>
      <TableCell>
        {tb(
          student.status === "active" &&
            (student.expiry_date ?? 0) <= renderedAt
            ? "expired"
            : student.status === "removed"
              ? "ended"
              : student.status,
        )}
      </TableCell>
      {showMonthlySubscription && (
        <TableCell className="min-w-52">
          <MonthlySubscriptionCell studentId={student.id} data={billing} />
        </TableCell>
      )}
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
