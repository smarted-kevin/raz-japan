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
import { type UserWithStudentData } from "../../_actions/schemas";

export default function UserTable({ users }: { users: UserWithStudentData[] }) {
  
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
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Students</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            (status === user.status) &&
            <TableRow key={user.id}>
              <TableCell>{`${user.first_name} ${user.last_name}`}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>{user.status}</TableCell>
              <TableCell>
                {user.students.length > 0 &&
                  <Dialog>
                    <DialogTrigger asChild><Button variant="outline" className="text-xs p-2">View Students</Button></DialogTrigger>
                    <DialogContent>
                      <DialogHeader>{`${user.students.length} ${user.students.length == 1 ? 'Current Student' : 'Current Students'}`}</DialogHeader>
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
                              <TableCell>{s.classroom_name}</TableCell>
                              <TableCell>{s.username}</TableCell>
                              <TableCell>{s.expiry_date}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </DialogContent>
                  </Dialog>
                }
                {user.students.length === 0 && 
                  "No Current Students"
                }
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  )
}