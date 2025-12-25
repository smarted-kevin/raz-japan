"use client";

import * as React from "react";
import AddStudentsDialog from "./addStudentsDialog";
import type { Id } from "@/convex/_generated/dataModel";

export default function AddStudentsButton({
  classroomId,
  courseId,
  currentStudentCount,
}: {
  classroomId: Id<"classroom">;
  courseId: Id<"course">;
  currentStudentCount: number;
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <AddStudentsDialog
      classroomId={classroomId}
      courseId={courseId}
      currentStudentCount={currentStudentCount}
      openState={open}
      setOpenState={setOpen}
    />
  );
}

