"use client";

import * as React from "react";
import EditMemberDialog from "./editMemberDialog";
import type { Id } from "convex/_generated/dataModel";

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
    <div className="flex flex-col gap-y-4 my-6 mx-12 p-6 border-2 rounded-lg w-2/3">
      <div className="flex gap-x-4 items-center">
        <h1 className="text-xl font-bold">Member Information</h1>
        <EditMemberDialog
          userId={userId}
          initialFirstName={firstName}
          initialLastName={lastName}
          initialEmail={email}
          openState={dialogOpen}
          setOpenState={setDialogOpen}
        />
      </div>
      <div className="flex flex-col gap-y-4">
        <div className="flex gap-x-8">
          <p className="font-bold">Name:</p>
          <p>{firstName} {lastName}</p>
        </div>
        <div className="flex gap-x-8">
          <p className="font-bold">Email:</p>
          <p>{email}</p>
        </div>
      </div>
    </div>
  );
}

