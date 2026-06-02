"use client";

import { useMemo, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
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
import { useAdminStatusLabel } from "../../_lib/useAdminStatusLabel";

export default function UserTable({ users }: { users: UserWithStudentData[] }) {
  const t = useTranslations("dashboard.admin.users");
  const tc = useTranslations("dashboard.admin.common");
  const statusLabel = useAdminStatusLabel();

  const roleLabels: Record<string, string> = useMemo(
    () => ({
      user: tc("role_users"),
      admin: tc("role_admins"),
      org_admin: tc("role_org_admins"),
      all: tc("all"),
    }),
    [tc]
  );

  const columns: ColumnDef<UserWithStudentData>[] = useMemo(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => (
          <button
            className="flex items-center gap-1"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            {tc("name")}
            <ArrowUpDown className="h-4 w-4" />
          </button>
        ),
        cell: () => null,
        accessorFn: (row) =>
          `${row.first_name ?? ""} ${row.last_name ?? ""}`.trim(),
      },
      {
        accessorKey: "email",
        header: ({ column }) => (
          <button
            className="flex items-center gap-1"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            {tc("email")}
            <ArrowUpDown className="h-4 w-4" />
          </button>
        ),
        cell: () => null,
      },
      {
        accessorKey: "role",
        header: ({ column }) => (
          <button
            className="flex items-center gap-1"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            {tc("role")}
            <ArrowUpDown className="h-4 w-4" />
          </button>
        ),
        cell: () => null,
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
            {tc("status")}
            <ArrowUpDown className="h-4 w-4" />
          </button>
        ),
        cell: () => null,
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
            {tc("students")}
            <ArrowUpDown className="h-4 w-4" />
          </button>
        ),
        cell: () => null,
        accessorFn: (row) => row.students.length,
      },
    ],
    [tc]
  );

  const [openState, setOpenState] = useState(false);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([
    { id: "status", value: "active" },
    { id: "role", value: "all" },
  ]);

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

  const roleFilter = useMemo(
    () =>
      (columnFilters.find((f) => f.id === "role")?.value as string) ?? "all",
    [columnFilters]
  );

  const statusFilter = useMemo(
    () =>
      (columnFilters.find((f) => f.id === "status")?.value as string) ??
      "active",
    [columnFilters]
  );

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
    <div className="space-y-4 w-full min-w-0">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-4 w-full items-stretch sm:items-center">
        <Select value={roleFilter} onValueChange={handleRoleFilterChange}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue>{roleLabels[roleFilter]}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{tc("all")}</SelectItem>
            <SelectItem value="user">{tc("role_users")}</SelectItem>
            <SelectItem value="admin">{tc("role_admins")}</SelectItem>
            <SelectItem value="org_admin">{tc("role_org_admins")}</SelectItem>
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue>{statusLabel(statusFilter)}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">{tc("active")}</SelectItem>
            <SelectItem value="inactive">{tc("inactive")}</SelectItem>
            <SelectItem value="removed">{tc("removed")}</SelectItem>
          </SelectContent>
        </Select>

        <div className="w-full sm:w-auto sm:ml-auto">
          <AddUserDialog openState={openState} setOpenState={setOpenState} />
        </div>
      </div>

      {table.getRowModel().rows.length > 0 ? (
        <>
          <div className="w-full min-w-0 -mx-4 sm:mx-0 overflow-x-auto">
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
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between px-2">
            <div className="text-muted-foreground text-sm">
              {t("total_users", {
                count: table.getFilteredRowModel().rows.length,
              })}
            </div>
            <div className="flex flex-wrap items-center gap-3 sm:gap-6">
              <div className="flex items-center gap-2">
                <span className="text-sm">{tc("rows_per_page")}</span>
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
                {tc("page_of", {
                  current: table.getState().pagination.pageIndex + 1,
                  total: table.getPageCount(),
                })}
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
        <p>{t("no_users")}</p>
      )}
    </div>
  );
}
