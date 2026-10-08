"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent } from "~/components/ui/card";
import { dateDisplayFormat } from "~/lib/formatters";
import { cn } from "~/lib/utils";
import type { StudentData } from "../../admin/_actions/schemas";
import { ExtendStudentByCode } from "./extendStudentByCode";
import {
  MonthlySubscriptionCell,
  type MemberBillingData,
} from "./monthlySubscriptionCell";

function isExpiryWithin60Days(
  expiryDate: number | undefined,
  renderedAt: number,
): boolean {
  if (!expiryDate) return false;
  const sixtyDaysInMs = 60 * 24 * 60 * 60 * 1000;
  return expiryDate - renderedAt <= sixtyDaysInMs;
}

export function MemberStudentCard({
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
  const t = useTranslations("dashboard.members");
  const tb = useTranslations("billing");
  const showExtendButton =
    student.status === "active" &&
    isExpiryWithin60Days(student.expiry_date, renderedAt);

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex flex-col gap-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-foreground truncate font-semibold">
                {student.username}
              </p>
              <p className="text-muted-foreground text-xs">
                {t("password")}: {student.password}
              </p>
            </div>
            <span
              className={cn(
                "shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
                student.status === "active"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground",
              )}
            >
              {tb(
                student.status === "active" &&
                  (student.expiry_date ?? 0) <= renderedAt
                  ? "expired"
                  : student.status === "removed"
                    ? "ended"
                    : student.status,
              )}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
            <span className="text-muted-foreground">{t("classroom")}</span>
            <span className="truncate">{student.classroom_name ?? "—"}</span>
            <span className="text-muted-foreground">{t("expiry")}</span>
            <span>{dateDisplayFormat(student.expiry_date) ?? "—"}</span>
          </div>
          {showMonthlySubscription && (
            <div className="border-border border-t pt-3">
              <p className="text-muted-foreground mb-2 text-xs font-medium">
                {t("monthly_subscription")}
              </p>
              <MonthlySubscriptionCell studentId={student.id} data={billing} />
            </div>
          )}
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
