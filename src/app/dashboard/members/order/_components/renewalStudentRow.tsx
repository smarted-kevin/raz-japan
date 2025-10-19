"use client";

import React from "react";
import type { StudentData } from "~/app/dashboard/admin/_actions/schemas";
import {
  TableCell,
  TableRow,
} from "~/components/ui/table";
import type { Id } from "convex/_generated/dataModel";
import { dateDisplayFormat } from "~/lib/formatters";

type CheckboxProps = {
  student: StudentData;
  onChange: (id: Id<"student">, checked: boolean) => void;
  existingStudents: Id<"student">[]
}

export function RenewalStudentRow(
  { student, onChange, existingStudents}:CheckboxProps
) {

  const [isChecked, setChecked] = React.useState<boolean>(existingStudents.includes(student.id));

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { checked } = event.target;
    setChecked(checked);
    onChange(student.id, checked);
  }

  return (
    <>
    <TableRow>
      <TableCell>
        <input type="checkbox"
          id={student.id}
          value={student.id}
          checked={isChecked}
          onChange={handleChange}
        />
      </TableCell>
      <TableCell>{student.status}</TableCell>
      <TableCell>{student.classroom_name}</TableCell>
      <TableCell>{student.username}</TableCell>
      <TableCell>{dateDisplayFormat(student.expiry_date) ?? "N/A"}</TableCell>
    </TableRow>
    </>
  )
}
