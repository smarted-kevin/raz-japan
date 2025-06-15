"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Button } from "~/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTrigger,
} from "~/components/ui/dialog";
import { type Classroom } from "../../_actions/schemas";

export default function ClassroomTable({ classrooms }: { classrooms: Classroom[] }) {
  
  const [status, setStatus] = useState("active")

  return (
    <>
      <Select value={status} onValueChange={setStatus}>
        <SelectTrigger className="w-1/2">
          <SelectValue>{status}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="active">active</SelectItem>
          <SelectItem value="inactive">inactive</SelectItem>
          <SelectItem value="removed">removed</SelectItem>
        </SelectContent>
      </Select>
      <Table>
        <TableHeader className="bg-primary-foreground">
          <TableRow>
            <TableHead>Classroom Name</TableHead>
            <TableHead>Course</TableHead>
            <TableHead>Organization</TableHead>
            <TableHead>Active Students</TableHead>
            <TableHead>Inactive Students</TableHead>
            <TableHead>Removed Students</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {classrooms.map((classroom) => (
            (status === classroom.status) &&
            <TableRow key={classroom.classroom_id}>
              <TableCell>{classroom.classroom_name}</TableCell>
              <TableCell>{classroom.course_name}</TableCell>
              <TableCell>{classroom.organization_name}</TableCell>
              <TableCell>{classroom.active_students}</TableCell>
              <TableCell>{classroom.inactive_students}</TableCell>
              <TableCell>{classroom.removed_students}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  )
}