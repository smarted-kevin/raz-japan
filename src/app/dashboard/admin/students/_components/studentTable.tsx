"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import StudentRow from "./studentRow";
import { capitalize } from "~/lib/formatters";
import { type Classroom, type StudentData } from "../../_actions/schemas";


export default function StudentTable( 
  { students, classrooms }:
  { students:StudentData[], classrooms:Classroom[]} ) {

  const [status, setStatus] = useState("active");
  
  return (
    <>
      <Select value={status} onValueChange={setStatus}>
        <SelectTrigger className="w-1/2">
          <SelectValue>{capitalize(status)}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="active">Active</SelectItem>
          <SelectItem value="inactive">Inactive</SelectItem>
          <SelectItem value="removed">Removed</SelectItem>
        </SelectContent>
      </Select>
      <Table>
        <TableHeader className="bg-primary-foreground">
          <TableRow>
            <TableHead></TableHead>
            <TableHead>Classroom</TableHead>
            <TableHead>Student Username</TableHead>
            <TableHead>Password</TableHead>
            <TableHead>Course</TableHead>
            <TableHead>Expiry Date</TableHead>
            <TableHead>Email Address</TableHead>
            <TableHead>Organization</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {students.map((student) => (
            (status === student.status) &&
            <StudentRow key={student.id} student={student} classrooms={classrooms} />
          ))}
        </TableBody>
      </Table>
    </>
  )
}