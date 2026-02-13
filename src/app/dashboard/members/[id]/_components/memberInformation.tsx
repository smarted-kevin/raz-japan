"use client";

import * as React from "react";
import EditMemberDialog from "./editMemberDialog";
import type { Id } from "convex/_generated/dataModel";
import {
  Card,
  CardContent,
  CardHeader,
  CardAction,
} from "~/components/ui/card";
import { User } from "lucide-react";

export default function MemberInformation({
  userId,
  firstName,
  lastName,
  email,
}: {
  userId: Id<"userTable">;
  firstName: string;
  lastName: string;
  email: string;
}) {
  const [dialogOpen, setDialogOpen] = React.useState(false);

  return (
    <Card className="w-full max-w-3xl overflow-hidden">
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <User className="h-5 w-5 text-primary" aria-hidden />
          </div>
          <div>
            <h1 className="text-lg font-semibold sm:text-xl">Member Information</h1>
            <p className="text-sm text-muted-foreground sm:hidden">
              {firstName} {lastName}
            </p>
          </div>
        </div>
        <CardAction>
          <EditMemberDialog
            userId={userId}
            initialFirstName={firstName}
            initialLastName={lastName}
            initialEmail={email}
            openState={dialogOpen}
            setOpenState={setDialogOpen}
          />
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-4 sm:space-y-3">
        <div className="grid gap-3 sm:grid-cols-[auto_1fr] sm:gap-x-6">
          <p className="text-sm font-medium text-muted-foreground sm:text-foreground sm:font-semibold">
            Name
          </p>
          <p className="text-sm sm:text-base sm:pl-0">{firstName} {lastName}</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-[auto_1fr] sm:gap-x-6">
          <p className="text-sm font-medium text-muted-foreground sm:text-foreground sm:font-semibold">
            Email
          </p>
          <a
            href={`mailto:${email}`}
            className="text-sm text-primary underline-offset-4 hover:underline sm:text-base"
          >
            {email}
          </a>
        </div>
      </CardContent>
    </Card>
  );
}

