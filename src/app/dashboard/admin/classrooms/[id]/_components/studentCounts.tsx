"use client";

import { useTranslations } from "next-intl";
import type { ClassroomStudentData } from "../../../_actions/schemas";

export default function StudentCounts({
  students,
}: {
  students: ClassroomStudentData[];
}) {
  const tc = useTranslations("dashboard.admin.common");
  const activeCount = students.filter((s) => s.status === "active").length;
  const inactiveCount = students.filter((s) => s.status === "inactive").length;
  const removedCount = students.filter((s) => s.status === "removed").length;

  return (
    <div className="flex gap-x-8 items-center">
      <div className="flex flex-col">
        <span className="text-sm text-muted-foreground">{tc("active")}</span>
        <span className="text-2xl font-bold">{activeCount}</span>
      </div>
      <div className="flex flex-col">
        <span className="text-sm text-muted-foreground">{tc("inactive")}</span>
        <span className="text-2xl font-bold">{inactiveCount}</span>
      </div>
      <div className="flex flex-col">
        <span className="text-sm text-muted-foreground">{tc("removed")}</span>
        <span className="text-2xl font-bold">{removedCount}</span>
      </div>
    </div>
  );
}
