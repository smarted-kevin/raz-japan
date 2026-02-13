"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { capitalize } from "~/lib/formatters";
import type { Id } from "convex/_generated/dataModel";
import { EditUserDialog } from "./editUserDialog";

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
  const fullName = `${firstName} ${lastName}`.trim() || "N/A";

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base sm:text-lg">User Information</CardTitle>
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
          <span className="text-muted-foreground">Name</span>
          <span className="font-medium">{fullName}</span>
          <span className="text-muted-foreground">Email</span>
          <span className="font-medium break-all">{email}</span>
          <span className="text-muted-foreground">Role</span>
          <span className="font-medium">{capitalize(role)}</span>
          <span className="text-muted-foreground">Status</span>
          <span className="font-medium">{capitalize(status)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
