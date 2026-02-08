"use client";

import { useMemo, useState } from "react";
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
import { Button } from "~/components/ui/button";
import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import StudentRow from "./studentRow";
import { capitalize } from "~/lib/formatters";
import { type Classroom, type StudentData } from "../../_actions/schemas";

const columns: ColumnDef<StudentData>[] = [
  {
    id: "actions",
    header: "",
    cell: () => null, // Handled by StudentRow
  },
  {
    accessorKey: "classroom",
    header: ({ column }) => (
      <button
        className="flex items-center gap-1"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Classroom
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
        Student Username
        <ArrowUpDown className="h-4 w-4" />
      </button>
    ),
    cell: () => null,
  },
  {
    accessorKey: "password",
    header: "Password",
    cell: () => null,
  },
  {
    accessorKey: "course",
    header: ({ column }) => (
      <button
        className="flex items-center gap-1"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Course
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
        Expiry Date
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
        Email Address
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
        Organization
        <ArrowUpDown className="h-4 w-4" />
      </button>
    ),
    cell: () => null,
  },
];

export default function StudentTable({
  students,
  classrooms,
}: {
  students: StudentData[];
  classrooms: Classroom[];
}) {
  const [status, setStatus] = useState("active");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  
  // Single mutation instance
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
            <SelectValue>{capitalize(status)}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="removed">Removed</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={classroomFilter}
          onValueChange={(value) =>
            table.getColumn("classroom")?.setFilterValue(value)
          }
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by classroom" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Classrooms</SelectItem>
            {classrooms.map((classroom) => (
              <SelectItem key={classroom.classroom_id} value={classroom.classroom_name}>
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
                  classroom={classroomMap.get(row.original.classroom_name ?? "") ?? undefined}
                  onRemove={removeStudent}
                />
              ))}
            </TableBody>
          </Table>

          <div className="flex items-center justify-between px-2">
            <div className="text-muted-foreground text-sm">
              {table.getFilteredRowModel().rows.length} total students
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
        <p>NO STUDENTS HERE!</p>
      )}
    </div>
  );
}