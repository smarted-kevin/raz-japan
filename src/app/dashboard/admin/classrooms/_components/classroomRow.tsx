"use client";

import { memo } from "react";
import { useTranslations } from "next-intl";
import {
  TableCell,
  TableRow,
} from "~/components/ui/table";
import Link from "next/link";
import DownloadButton from "./downloadButton";
import type { Classroom } from "../../_actions/schemas";
import { useAdminStatusLabel } from "../../_lib/useAdminStatusLabel";

interface ClassroomRowProps {
  classroom: Classroom;
}

const ClassroomRow = memo(function ClassroomRow({ classroom }: ClassroomRowProps) {
  const tc = useTranslations("dashboard.admin.common");
  const statusLabel = useAdminStatusLabel();

  return (
    <TableRow>
      <TableCell>
        <DownloadButton
          classroomId={classroom.classroom_id}
          classroomName={classroom.classroom_name}
        />
      </TableCell>
      <TableCell>
        <Link href={`/dashboard/admin/classrooms/${classroom.classroom_id}`}>
          {classroom.classroom_name}
        </Link>
      </TableCell>
      <TableCell>
        {classroom.status
          ? statusLabel(classroom.status)
          : tc("na")}
      </TableCell>
      <TableCell>{classroom.course_name ?? tc("na")}</TableCell>
      <TableCell>{classroom.organization_name ?? tc("na")}</TableCell>
      <TableCell>{classroom.active_students ?? 0}</TableCell>
      <TableCell>{classroom.inactive_students ?? 0}</TableCell>
      <TableCell>{classroom.removed_students ?? 0}</TableCell>
    </TableRow>
  );
});

export default ClassroomRow;
