"use client";

import * as React from "react";
import {
  TableCell,
  TableRow,
} from "~/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Button } from "~/components/ui/button";
import { ActivateDialog } from "./activateDialog";
import { SquarePen } from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "~/convex/_generated/api";
import { useRouter } from "next/navigation";
import { type Classroom, type StudentData } from "../../_actions/schemas";
import { format } from "date-fns";


export default function StudentRow({ 
  student, classrooms }: {
  student:StudentData, classrooms:Classroom[] 
}) {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();


  //Function to set student status to "removed"
  const removeStudent = useMutation(api.mutations.student.setStudentStatus);
  //Filter classrooms to get student classroom to use course name for display
  const student_classroom = classrooms.filter((c)=> c.classroom_name === student.classroom_name);

  
  const [isPending, startTransition] = React.useTransition();


  return (
    <>
      <TableRow key={student.username}>
        <TableCell>
          <div className="flex gap-x-2 items-center">
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger className="text-xl" title="Edit Student">
                <SquarePen className="text-blue-600" size="16px" />
              </DialogTrigger>
              <DialogContent>
                <DialogTitle>Edit Student</DialogTitle>
                <form>
                  <div className="flex flex-col gap-y-4">
                    <div className="flex gap-x-4 items-center">
                      <Label htmlFor="username">Username</Label>
                      <Input name="username" id="username" type="text" defaultValue={student.username} placeholder={student.username} required />
                    </div>
                    <div className="flex gap-x-4 items-center">
                      <Label htmlFor="username">Classroom</Label>
                      <Select defaultValue={student_classroom[0]?.classroom_id} name="classroom_id" required>
                        <SelectTrigger className="w-1/2">
                          <SelectValue></SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {classrooms.map((classroom) => (
                            <SelectItem key={classroom.classroom_name} value={classroom.classroom_id}>{classroom.classroom_name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex gap-x-4 items-center">
                      <Label htmlFor="password">Password</Label>
                      <Input id="password" type="text" name="password" defaultValue={student.password} placeholder={student.password} required />
                    </div>
                    <Input type="hidden" name="id" id="id" value={student.id} />
                    <Button type="submit">Save Changes</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
            {student.status === "active"  &&
              <>
              <span className="items-center">|</span>
              <Button
                variant="ghost"
                disabled={isPending}
                onClick={() => {
                  startTransition(async () => {
                    await removeStudent({student_id: student.id, status: "removed"});
                  })
                }}
              >
                Remove
              </Button>
              </>
            }
            {student.status !== "active"  &&
              <>
                <span className="items-center">|</span>
                <ActivateDialog id={student.id} />
              </>
            }
          </div>
        </TableCell>
        <TableCell>{student.classroom_name}</TableCell>
        <TableCell>{student.username}</TableCell>
        <TableCell>{student.password}</TableCell>
        <TableCell>{student_classroom[0]?.course_name}</TableCell>
        <TableCell>{student.expiry_date ?? ""}</TableCell>
        <TableCell>{student.user_email ?? ""}</TableCell>
        <TableCell>{student_classroom[0]?.organization_name}</TableCell>
      </TableRow>
    </>
  )
}