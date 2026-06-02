"use client";

import { memo, useState } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import {
  TableCell,
  TableRow,
} from "~/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
} from "~/components/ui/table";
import { Button } from "~/components/ui/button";
import type { UserWithStudentData } from "../../_actions/schemas";
import { dateDisplayFormat } from "~/lib/formatters";
import { useAdminStatusLabel } from "../../_lib/useAdminStatusLabel";

interface UserRowProps {
  user: UserWithStudentData;
}

const UserRow = memo(function UserRow({ user }: UserRowProps) {
  const t = useTranslations("dashboard.admin.users");
  const tc = useTranslations("dashboard.admin.common");
  const statusLabel = useAdminStatusLabel();
  const [open, setOpen] = useState(false);
  const fullName =
    `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim() || tc("na");

  const roleLabel =
    user.role === "user"
      ? tc("role_user")
      : user.role === "admin"
        ? tc("role_admin")
        : user.role === "org_admin"
          ? tc("role_org_admin")
          : (user.role ?? tc("na"));

  return (
    <TableRow>
      <TableCell>
        <Link
          href={`/dashboard/admin/users/${user.id}`}
          className="text-primary hover:underline font-medium"
        >
          {fullName}
        </Link>
      </TableCell>
      <TableCell>{user.email ?? tc("na")}</TableCell>
      <TableCell>{roleLabel}</TableCell>
      <TableCell>{statusLabel(user.status ?? "")}</TableCell>
      <TableCell>
        {user.students.length > 0 ? (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="text-xs p-2">
                {t("view_students")}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogTitle>{tc("students")}</DialogTitle>
              <DialogHeader>
                {`${user.students.length} ${user.students.length === 1 ? t("current_student") : t("current_students")}`}
              </DialogHeader>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("teacher_username")}</TableHead>
                    <TableHead>{tc("username")}</TableHead>
                    <TableHead>{tc("expiry_date")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {user.students.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell>{s.classroom_name ?? tc("na")}</TableCell>
                      <TableCell>{s.username}</TableCell>
                      <TableCell>{dateDisplayFormat(s.expiry_date)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </DialogContent>
          </Dialog>
        ) : (
          t("no_current_students")
        )}
      </TableCell>
    </TableRow>
  );
});

export default UserRow;
