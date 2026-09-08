"use client";

import type { StudentData } from "~/app/dashboard/admin/_actions/schemas";
import { TableCell, TableRow } from "~/components/ui/table";
import type { Id } from "@/convex/_generated/dataModel";
import { dateDisplayFormat } from "~/lib/formatters";
import { useTranslations } from "next-intl";

export function RenewalStudentRow({
  student,
  eligible,
  checked,
  onChange,
  busy,
}: {
  student: StudentData;
  eligible: boolean;
  checked: boolean;
  busy: boolean;
  onChange: (id: Id<"student">, checked: boolean) => void;
}) {
  const t = useTranslations("dashboard.members.order");
  const hasExpiry =
    student.expiry_date !== undefined && Number.isFinite(student.expiry_date);
  return (
    <TableRow
      className={
        eligible
          ? undefined
          : "bg-muted/60 text-muted-foreground hover:bg-muted/60"
      }
    >
      <TableCell>
        <input
          type="checkbox"
          className="accent-primary size-4 disabled:cursor-not-allowed"
          aria-label={t("renew_student", { username: student.username })}
          aria-describedby={!eligible ? "renewal-help" : undefined}
          checked={eligible && checked}
          disabled={!eligible || busy}
          onChange={(event) => onChange(student.id, event.target.checked)}
        />
      </TableCell>
      <TableCell className="font-medium">{student.username}</TableCell>
      <TableCell>{t(`status_${student.status}`)}</TableCell>
      <TableCell>{student.classroom_name || "—"}</TableCell>
      <TableCell>
        {hasExpiry
          ? dateDisplayFormat(student.expiry_date)
          : t("unknown_expiry")}
      </TableCell>
    </TableRow>
  );
}
