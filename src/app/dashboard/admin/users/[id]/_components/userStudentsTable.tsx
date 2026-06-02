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
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { dateDisplayFormat } from "~/lib/formatters";
import type { Id } from "convex/_generated/dataModel";
import { useAdminStatusLabel } from "../../../_lib/useAdminStatusLabel";

type StudentData = {
  id: Id<"student">;
  username: string;
  user_id: Id<"userTable"> | undefined;
  expiry_date: number | undefined;
  status: string;
  classroom_name: string;
};

export function UserStudentsTable({ students }: { students: StudentData[] }) {
  const t = useTranslations("dashboard.admin.users");
  const tc = useTranslations("dashboard.admin.common");
  const statusLabel = useAdminStatusLabel();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base sm:text-lg">
          {t("students_count", { count: students.length })}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {students.length === 0 ? (
          <p className="text-muted-foreground text-sm py-4">
            {t("no_students_for_user")}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>{tc("username")}</TableHead>
                  <TableHead>{tc("classroom")}</TableHead>
                  <TableHead>{tc("status")}</TableHead>
                  <TableHead>{tc("expiry_date")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium">{student.username}</TableCell>
                    <TableCell>{student.classroom_name}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs">
                        {statusLabel(student.status)}
                      </span>
                    </TableCell>
                    <TableCell>
                      {student.expiry_date
                        ? dateDisplayFormat(student.expiry_date)
                        : tc("na")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
