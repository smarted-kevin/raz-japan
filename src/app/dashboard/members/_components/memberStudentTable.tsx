"use client";

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import type { StudentData } from "../../admin/_actions/schemas";
import { MemberStudentRow } from "./memberStudentRow";


export function MemberStudentTable({ students }:{ students:StudentData[] }) {

  return (
    <Table>
      <TableHeader className="bg-primary-foreground">
        <TableRow>
          <TableHead>Student Username</TableHead>
          <TableHead>Password</TableHead>
          <TableHead>Classroom</TableHead>
          <TableHead>Expiry Date</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {students.map((student) => (
          <MemberStudentRow key={student.id} student={student} />
        ))}
      </TableBody>
    </Table>

  );

}