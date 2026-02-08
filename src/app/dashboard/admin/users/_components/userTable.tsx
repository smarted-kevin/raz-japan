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
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import AddUserDialog from "./addUserDialog";
import type { UserWithStudentData } from "../../_actions/schemas";
import { dateDisplayFormat } from "~/lib/formatters";

const roleLabels: Record<string, string> = {
  user: "Users",
  admin: "Admins",
  org_admin: "Organization Admins",
  all: "All",
};

export default function UserTable({ users }: { users: UserWithStudentData[] }) {
  
  const [openState, setOpenState] = React.useState(false);
  const [status, setStatus] = React.useState("active");
  const [roleFilter, setRoleFilter] = React.useState("user");

  const filteredUsers = React.useMemo(() => {
    return users.filter((user) => {
      const statusMatch = user.status === status;
      const roleMatch = roleFilter === "all" || user.role === roleFilter;
      return statusMatch && roleMatch;
    });
  }, [users, status, roleFilter]);

  return (
    <>
      <div className="flex gap-x-4 w-full items-center">
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue>{roleLabels[roleFilter]}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="user">Users</SelectItem>
            <SelectItem value="admin">Admins</SelectItem>
            <SelectItem value="org_admin">Organization Admins</SelectItem>
            <SelectItem value="all">All</SelectItem>
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[150px]">
            <SelectValue>{status}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">active</SelectItem>
            <SelectItem value="inactive">inactive</SelectItem>
            <SelectItem value="removed">removed</SelectItem>
          </SelectContent>
        </Select>
        <div className="ml-auto">
          <AddUserDialog 
            openState={openState}
            setOpenState={setOpenState}
          />
        </div>
      </div>
      <Table>
        <TableHeader className="bg-primary-foreground">
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Students</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredUsers.map((user) => (
            <TableRow key={user.id}>
              <TableCell>{`${user.first_name} ${user.last_name}`}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>{user.role}</TableCell>
              <TableCell>{user.status}</TableCell>
              <TableCell>
                {user.students.length > 0 &&
                  <Dialog>
                    <DialogTrigger asChild><Button variant="outline" className="text-xs p-2">View Students</Button></DialogTrigger>
                    <DialogContent>
                      <DialogTitle>Students</DialogTitle>
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
                              <TableCell>{dateDisplayFormat(s.expiry_date)}</TableCell>
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