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
import DownloadButton from "./downloadButton";
import { type Classroom, type Course, type Organization } from "../../_actions/schemas";
import Link from "next/link";

interface ClassroomTableProps {
  classrooms: Classroom[];
  courses: Course[];
  orgs: Organization[];
  isOrgAdmin?: boolean;
}

export default function ClassroomTable({ 
  classrooms, courses, orgs, isOrgAdmin = false 
}: ClassroomTableProps) {
  
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
        {!isOrgAdmin && (
          <AddClassroomDialog 
            courses={courses} 
            orgs={orgs}
            openState={openState}
            setOpenState={setOpenState}
          />
        )}
      </div>
      <Table>
        <TableHeader className="bg-primary-foreground">
          <TableRow>
            <TableHead className="w-12">Export</TableHead>
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
              <TableCell>
                <DownloadButton 
                  classroomId={classroom.classroom_id}
                  classroomName={classroom.classroom_name}
                />
              </TableCell>
              <TableCell><Link href={`/dashboard/admin/classrooms/${classroom.classroom_id}`}>{classroom.classroom_name}</Link></TableCell>
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