"use client";

import { Card, CardContent } from "~/components/ui/card";
import { dateDisplayFormat } from "~/lib/formatters";
import { cn } from "~/lib/utils";
import type { StudentData } from "../../admin/_actions/schemas";
import { ExtendStudentByCode } from "./extendStudentByCode";

function isExpiryWithin60Days(expiryDate: number | undefined): boolean {
  if (!expiryDate) return false;
  const now = Date.now();
  const sixtyDaysInMs = 60 * 24 * 60 * 60 * 1000;
  return expiryDate - now <= sixtyDaysInMs;
}

export function MemberStudentCard({ student }: { student: StudentData }) {
  const showExtendButton =
    student.status === "active" && isExpiryWithin60Days(student.expiry_date);

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex flex-col gap-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-foreground">
                {student.username}
              </p>
              <p className="text-xs text-muted-foreground">
                Password: {student.password}
              </p>
            </div>
            <span
              className={cn(
                "shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
                student.status === "active"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {student.status}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
            <span className="text-muted-foreground">Classroom</span>
            <span className="truncate">{student.classroom_name ?? "—"}</span>
            <span className="text-muted-foreground">Expiry</span>
            <span>{dateDisplayFormat(student.expiry_date) ?? "—"}</span>
          </div>
          {showExtendButton && (
            <div className="pt-2">
              <ExtendStudentByCode
                studentId={student.id}
                studentUsername={student.username}
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
