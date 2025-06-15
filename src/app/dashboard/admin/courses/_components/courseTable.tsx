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
import { type Course } from "../../_actions/schemas";

export default function CourseTable({ courses }: { courses: Course[] }) {
  
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
            <TableHead>Course Name</TableHead>
            <TableHead>Price</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {courses.map((course) => (
            (status === course.status) &&
            <TableRow key={course._id}>
              <TableCell>{course.course_name}</TableCell>
              <TableCell>{course.price}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  )
}