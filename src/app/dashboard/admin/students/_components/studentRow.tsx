"use client";

import { memo, useState, useTransition, useMemo } from "react";
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
import { type Classroom, type StudentData } from "../../_actions/schemas";
import { dateDisplayFormat } from "~/lib/formatters";
import type { Id } from "@/convex/_generated/dataModel";

interface StudentRowProps {
  student: StudentData;
  classroom: Classroom | undefined;
  onRemove: (args: { student_id: Id<"student">; status: "active" | "inactive" | "removed" }) => Promise<unknown>;
}

const StudentRow = memo(function StudentRow({
  student,
  classroom,
  onRemove,
}: StudentRowProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();


  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-x-2">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger title="Edit Student">
              <SquarePen className="text-blue-600" size={16} />
            </DialogTrigger>
            {open && (
              <DialogContent>
                <DialogTitle>Edit Student</DialogTitle>
                <form>
                  <div className="flex flex-col gap-y-4">
                    <div className="flex items-center gap-x-4">
                      <Label htmlFor="username">Username</Label>
                      <Input
                        name="username"
                        id="username"
                        type="text"
                        defaultValue={student.username}
                        required
                      />
                    </div>
                    <div className="flex items-center gap-x-4">
                      <Label htmlFor="classroom_id">Classroom</Label>
                      <Select
                        defaultValue={classroom?.classroom_id}
                        name="classroom_id"
                        required
                      >
                        <SelectTrigger className="w-1/2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {classroom && (
                            <SelectItem
                              key={classroom.classroom_id}
                              value={classroom.classroom_id}
                            >
                              {classroom.classroom_name}
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-x-4">
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="text"
                        name="password"
                        defaultValue={student.password}
                        required
                      />
                    </div>
                    <Input type="hidden" name="id" value={student.id} />
                    <Button type="submit">Save Changes</Button>
                  </div>
                </form>
              </DialogContent>
            )}
          </Dialog>

          <span>|</span>

          {student.status === "active" ? (
            <Button
              variant="ghost"
              size="sm"
              disabled={isPending}
              onClick={() => {
                startTransition(async () => {
                  await onRemove({ student_id: student.id, status: "removed" });
                });
              }}
            >
              Remove
            </Button>
          ) : (
            <ActivateDialog id={student.id} />
          )}
        </div>
      </TableCell>
      <TableCell>{student.classroom_name}</TableCell>
      <TableCell>{student.username}</TableCell>
      <TableCell>{student.password}</TableCell>
      <TableCell>{classroom?.course_name}</TableCell>
      <TableCell>{dateDisplayFormat(student.expiry_date) ?? ""}</TableCell>
      <TableCell>{student.user_email ?? ""}</TableCell>
      <TableCell>{classroom?.organization_name}</TableCell>
    </TableRow>
  );
});

export default StudentRow;