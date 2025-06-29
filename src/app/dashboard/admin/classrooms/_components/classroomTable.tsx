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
import AddClassroomDialog from "./addClassroomDialog";
import { type Classroom, type Course, type Organization } from "../../_actions/schemas";

export default function ClassroomTable({ 
  classrooms, courses, orgs 
}: { 
  classrooms: Classroom[],
  courses: Course[],
  orgs: Organization[]
}) {
  
  const [openState, setOpenState] = React.useState(false);
  const [status, setStatus] = React.useState("active");

  return (
    <>
      <div className="flex gap-x-10 w-3/4 justify-between">
        <Select 
          value={status} 
          onValueChange={setStatus}
        >
          <SelectTrigger className="min-w-24 w-1/3">
            <SelectValue>{status}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">active</SelectItem>
            <SelectItem value="inactive">inactive</SelectItem>
            <SelectItem value="removed">removed</SelectItem>
          </SelectContent>
        </Select>
        <AddClassroomDialog 
          courses={courses} 
          orgs={orgs}
          openState={openState}
          setOpenState={setOpenState}
        />
      </div>
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