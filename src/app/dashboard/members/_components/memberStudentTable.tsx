"use client";

import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import type { StudentData } from "../../admin/_actions/schemas";
import { MemberStudentRow } from "./memberStudentRow";
import { MemberStudentCard } from "./memberStudentCard";

export function MemberStudentTable({ students }: { students: StudentData[] }) {
  return (
    <>
      {/* Mobile: Card layout */}
      <div className="flex flex-col gap-3 md:hidden">
        {students.map((student) => (
          <MemberStudentCard key={student.id} student={student} />
        ))}
      </div>

      {/* Desktop: Table layout */}
      <div className="hidden md:block">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>Student Username</TableHead>
              <TableHead>Password</TableHead>
              <TableHead>Classroom</TableHead>
              <TableHead>Expiry Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.map((student) => (
              <MemberStudentRow key={student.id} student={student} />
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}