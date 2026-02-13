"use client";

import { memo, useState } from "react";
import Link from "next/link";
import {
  TableCell,
  TableRow,
} from "~/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
} from "~/components/ui/table";
import { Button } from "~/components/ui/button";
import type { UserWithStudentData } from "../../_actions/schemas";
import { dateDisplayFormat } from "~/lib/formatters";

interface UserRowProps {
  user: UserWithStudentData;
}

const UserRow = memo(function UserRow({ user }: UserRowProps) {
  const [open, setOpen] = useState(false);
  const fullName = `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim() || "N/A";

  return (
    <TableRow>
      <TableCell>
        <Link
          href={`/dashboard/admin/users/${user.id}`}
          className="text-primary hover:underline font-medium"
        >
          {fullName}
        </Link>
      </TableCell>
      <TableCell>{user.email ?? "N/A"}</TableCell>
      <TableCell>{user.role ?? "N/A"}</TableCell>
      <TableCell>{user.status ?? "N/A"}</TableCell>
      <TableCell>
        {user.students.length > 0 ? (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="text-xs p-2">
                View Students
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogTitle>Students</DialogTitle>
              <DialogHeader>
                {`${user.students.length} ${user.students.length === 1 ? "Current Student" : "Current Students"}`}
              </DialogHeader>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Teacher Username</TableHead>
                    <TableHead>Student Username</TableHead>
                    <TableHead>Expiry Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {user.students.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell>{s.classroom_name ?? "N/A"}</TableCell>
                      <TableCell>{s.username}</TableCell>
                      <TableCell>{dateDisplayFormat(s.expiry_date)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </DialogContent>
          </Dialog>
        ) : (
          "No Current Students"
        )}
      </TableCell>
    </TableRow>
  );
});

export default UserRow;
