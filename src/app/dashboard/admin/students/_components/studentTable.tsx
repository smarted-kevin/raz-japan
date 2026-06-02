"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useMutation } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Button } from "~/components/ui/button";
import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import StudentRow from "./studentRow";
import { type Classroom, type StudentData } from "../../_actions/schemas";
import { useAdminStatusLabel } from "../../_lib/useAdminStatusLabel";

export default function StudentTable({
  students,
  classrooms,
}: {
  students: StudentData[];
  classrooms: Classroom[];
}) {
  const t = useTranslations("dashboard.admin.students");
  const tc = useTranslations("dashboard.admin.common");
  const statusLabel = useAdminStatusLabel();

  const columns: ColumnDef<StudentData>[] = useMemo(
    () => [
      {
        id: "actions",
        header: "",
        cell: () => null,
      },
      {
        accessorKey: "classroom",
        header: ({ column }) => (
          <button
            className="flex items-center gap-1"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            {tc("classroom")}
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
        accessorKey: "username",
        header: ({ column }) => (
          <button
            className="flex items-center gap-1"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            {tc("username")}
            <ArrowUpDown className="h-4 w-4" />
          </button>
        ),
        cell: () => null,
      },
      {
        accessorKey: "password",
        header: tc("password"),
        cell: () => null,
      },
      {
        accessorKey: "course",
        header: ({ column }) => (
          <button
            className="flex items-center gap-1"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            {tc("course")}
            <ArrowUpDown className="h-4 w-4" />
          </button>
        ),
        cell: () => null,
      },
      {
        accessorKey: "expiry_date",
        header: ({ column }) => (
          <button
            className="flex items-center gap-1"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            {tc("expiry_date")}
            <ArrowUpDown className="h-4 w-4" />
          </button>
        ),
        cell: () => null,
      },
      {
        accessorKey: "email",
        header: ({ column }) => (
          <button
            className="flex items-center gap-1"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            {t("email_address")}
            <ArrowUpDown className="h-4 w-4" />
          </button>
        ),
        cell: () => null,
      },
      {
        accessorKey: "organization",
        header: ({ column }) => (
          <button
            className="flex items-center gap-1"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            {tc("organization")}
            <ArrowUpDown className="h-4 w-4" />
          </button>
        ),
        cell: () => null,
      },
    ],
    [t, tc]
  );

  const [status, setStatus] = useState("active");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const removeStudent = useMutation(api.mutations.student.setStudentStatus);

  const filteredByStatus = useMemo(
    () => students.filter((student) => student.status === status),
    [students, status]
  );

  const classroomMap = useMemo(
    () => new Map(classrooms.map((c) => [c.classroom_name, c])),
    [classrooms]
  );

  const tableData = useMemo(
    () =>
      filteredByStatus.map((student) => {
        const cr = classroomMap.get(student.classroom_name ?? "") ?? undefined;
        return {
          ...student,
          classroom: student.classroom_name,
          course: cr?.course_name ?? "",
          email: student.user_email ?? "",
          organization: cr?.organization_name ?? "",
        };
      }),
    [filteredByStatus, classroomMap]
  );

  const table = useReactTable({
    data: tableData,
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

  const classroomFilter =
    (columnFilters.find((f) => f.id === "classroom")?.value as string) ?? "all";

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-48">
            <SelectValue>{statusLabel(status)}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">{tc("active")}</SelectItem>
            <SelectItem value="inactive">{tc("inactive")}</SelectItem>
            <SelectItem value="removed">{tc("removed")}</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={classroomFilter}
          onValueChange={(value) =>
            table.getColumn("classroom")?.setFilterValue(value)
          }
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder={tc("filter_by_classroom")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{tc("filter_all_classrooms")}</SelectItem>
            {classrooms.map((classroom) => (
              <SelectItem
                key={classroom.classroom_id}
                value={classroom.classroom_name}
              >
                {classroom.classroom_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
                <StudentRow
                  key={row.original.id}
                  student={row.original}
                  classroom={
                    classroomMap.get(row.original.classroom_name ?? "") ??
                    undefined
                  }
                  onRemove={removeStudent}
                />
              ))}
            </TableBody>
          </Table>

          <div className="flex items-center justify-between px-2">
            <div className="text-muted-foreground text-sm">
              {t("total_students", {
                count: table.getFilteredRowModel().rows.length,
              })}
            </div>
            <div className="flex items-center gap-6">
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
        <p>{t("no_students")}</p>
      )}
    </div>
  );
}
