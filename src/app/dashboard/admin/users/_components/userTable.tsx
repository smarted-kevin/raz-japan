"use client";

import { useMemo, useState, useCallback } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
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
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import AddUserDialog from "./addUserDialog";
import UserRow from "./userRow";
import type { UserWithStudentData } from "../../_actions/schemas";
import { capitalize } from "~/lib/formatters";

const roleLabels: Record<string, string> = {
  user: "Users",
  admin: "Admins",
  org_admin: "Organization Admins",
  all: "All",
};

const columns: ColumnDef<UserWithStudentData>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <button
        className="flex items-center gap-1"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Name
        <ArrowUpDown className="h-4 w-4" />
      </button>
    ),
    cell: () => null, // Handled by UserRow
    accessorFn: (row) => `${row.first_name ?? ""} ${row.last_name ?? ""}`.trim(),
  },
  {
    accessorKey: "email",
    header: ({ column }) => (
      <button
        className="flex items-center gap-1"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Email
        <ArrowUpDown className="h-4 w-4" />
      </button>
    ),
    cell: () => null, // Handled by UserRow
  },
  {
    accessorKey: "role",
    header: ({ column }) => (
      <button
        className="flex items-center gap-1"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Role
        <ArrowUpDown className="h-4 w-4" />
      </button>
    ),
    cell: () => null, // Handled by UserRow
    filterFn: (row, id, value: string) => {
      if (value === "all") return true;
      return row.getValue(id) === value;
    },
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <button
        className="flex items-center gap-1"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Status
        <ArrowUpDown className="h-4 w-4" />
      </button>
    ),
    cell: () => null, // Handled by UserRow
    filterFn: (row, id, value: string) => {
      return row.getValue(id) === value;
    },
  },
  {
    accessorKey: "students",
    header: ({ column }) => (
      <button
        className="flex items-center gap-1"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Students
        <ArrowUpDown className="h-4 w-4" />
      </button>
    ),
    cell: () => null, // Handled by UserRow
    accessorFn: (row) => row.students.length,
  },
];

export default function UserTable({ users }: { users: UserWithStudentData[] }) {
  const [openState, setOpenState] = useState(false);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([
    { id: "status", value: "active" },
    { id: "role", value: "all" },
  ]);

  // Memoize table data - let TanStack Table handle all filtering
  const table = useReactTable({
    data: users,
    columns,
    state: { sorting, columnFilters },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: { pageSize: 20 },
    },
  });

  // Memoize filter values
  const roleFilter = useMemo(
    () => (columnFilters.find((f) => f.id === "role")?.value as string) ?? "all",
    [columnFilters]
  );

  const statusFilter = useMemo(
    () => (columnFilters.find((f) => f.id === "status")?.value as string) ?? "active",
    [columnFilters]
  );

  // Memoize callbacks
  const handleRoleFilterChange = useCallback(
    (value: string) => {
      table.getColumn("role")?.setFilterValue(value);
    },
    [table]
  );

  const handleStatusFilterChange = useCallback(
    (value: string) => {
      table.getColumn("status")?.setFilterValue(value);
    },
    [table]
  );

  return (
    <div className="space-y-4">
      <div className="flex gap-4 w-full items-center">
        <Select value={roleFilter} onValueChange={handleRoleFilterChange}>
          <SelectTrigger className="w-[200px]">
            <SelectValue>{roleLabels[roleFilter]}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="user">Users</SelectItem>
            <SelectItem value="admin">Admins</SelectItem>
            <SelectItem value="org_admin">Organization Admins</SelectItem>
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
          <SelectTrigger className="w-[150px]">
            <SelectValue>{capitalize(statusFilter)}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="removed">Removed</SelectItem>
          </SelectContent>
        </Select>

        <div className="ml-auto">
          <AddUserDialog openState={openState} setOpenState={setOpenState} />
        </div>
      </div>

      {table.getRowModel().rows.length > 0 ? (
        <>
          <Table>
            <TableHeader className="bg-primary-foreground">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.map((row) => (
                <UserRow key={row.original.id} user={row.original} />
              ))}
            </TableBody>
          </Table>

          <div className="flex items-center justify-between px-2">
            <div className="text-muted-foreground text-sm">
              {table.getFilteredRowModel().rows.length} total users
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <span className="text-sm">Rows per page</span>
                <Select
                  value={String(table.getState().pagination.pageSize)}
                  onValueChange={(value) => table.setPageSize(Number(value))}
                >
                  <SelectTrigger className="w-18">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[10, 20, 30, 50].map((size) => (
                      <SelectItem key={size} value={String(size)}>
                        {size}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="text-sm">
                Page {table.getState().pagination.pageIndex + 1} of{" "}
                {table.getPageCount()}
              </div>

              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => table.setPageIndex(0)}
                  disabled={!table.getCanPreviousPage()}
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                  disabled={!table.getCanNextPage()}
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </>
      ) : (
        <p>NO USERS HERE!</p>
      )}
    </div>
  );
}