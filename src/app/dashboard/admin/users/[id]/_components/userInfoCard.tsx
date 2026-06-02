"use client";

import { useTranslations } from "next-intl";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import type { Id } from "convex/_generated/dataModel";
import { EditUserDialog } from "./editUserDialog";
import { useAdminStatusLabel } from "../../../_lib/useAdminStatusLabel";

type UserInfoCardProps = {
  userId: Id<"userTable">;
  firstName: string;
  lastName: string;
  email: string;
  status: string;
  role: string;
};

export function UserInfoCard({
  userId,
  firstName,
  lastName,
  email,
  status,
  role,
}: UserInfoCardProps) {
  const t = useTranslations("dashboard.admin.users");
  const tc = useTranslations("dashboard.admin.common");
  const statusLabel = useAdminStatusLabel();
  const fullName = `${firstName} ${lastName}`.trim() || tc("na");

  const roleLabel =
    role === "user"
      ? tc("role_user")
      : role === "admin"
        ? tc("role_admin")
        : role === "org_admin"
          ? tc("role_org_admin")
          : role;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base sm:text-lg">{t("user_information")}</CardTitle>
        <EditUserDialog
          userId={userId}
          initialFirstName={firstName}
          initialLastName={lastName}
          initialEmail={email}
          initialStatus={status}
        />
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <span className="text-muted-foreground">{tc("name")}</span>
          <span className="font-medium">{fullName}</span>
          <span className="text-muted-foreground">{tc("email")}</span>
          <span className="font-medium break-all">{email}</span>
          <span className="text-muted-foreground">{tc("role")}</span>
          <span className="font-medium">{roleLabel}</span>
          <span className="text-muted-foreground">{tc("status")}</span>
          <span className="font-medium">{statusLabel(status)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
