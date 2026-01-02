"use client";

import * as React from "react";
import {
  Table,
  TableBody,
  TableCell,
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
import AddCourseDialog from "./addCourseDialog";
import { type Course } from "../../_actions/schemas";
import { formatYen } from "~/lib/formatters";

export default function CourseTable({ courses }: { courses: Course[] }) {
  
  const [openState, setOpenState] = React.useState(false);
  const [status, setStatus] = React.useState("active")

  return (
    <>
      <div className="flex gap-x-10 w-3/4 justify-between">
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
        <AddCourseDialog
          openState={openState}
          setOpenState={setOpenState}
        />
      </div>
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
              <TableCell>{formatYen(course.price)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  )
}