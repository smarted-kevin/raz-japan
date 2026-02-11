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
import AddClassroomDialog from "./addClassroomDialog";
import ClassroomRow from "./classroomRow";
import { type Classroom, type Course, type Organization } from "../../_actions/schemas";
import { capitalize } from "~/lib/formatters";

interface ClassroomTableProps {
  classrooms: Classroom[];
  courses: Course[];
  orgs: Organization[];
  isOrgAdmin?: boolean;
}

const columns: ColumnDef<Classroom>[] = [
  {
    id: "export",
    header: "",
    cell: () => null, // Handled by ClassroomRow
  },
  {
    accessorKey: "classroom_name",
    header: ({ column }) => (
      <button
        className="flex items-center gap-1"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Classroom Name
        <ArrowUpDown className="h-4 w-4" />
      </button>
    ),
    cell: () => null, // Handled by ClassroomRow
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
    cell: () => null, // Handled by ClassroomRow
    filterFn: (row, id, value: string) => {
      return row.getValue(id) === value;
    },
  },
  {
    accessorKey: "course_name",
    header: ({ column }) => (
      <button
        className="flex items-center gap-1"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Course
        <ArrowUpDown className="h-4 w-4" />
      </button>
    ),
    cell: () => null, // Handled by ClassroomRow
    filterFn: (row, id, value: string) => {
      if (value === "all") return true;
      return row.getValue(id) === value;
    },
  },
  {
    accessorKey: "organization_name",
    header: ({ column }) => (
      <button
        className="flex items-center gap-1"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Organization
        <ArrowUpDown className="h-4 w-4" />
      </button>
    ),
    cell: () => null, // Handled by ClassroomRow
    filterFn: (row, id, value: string) => {
      if (value === "all") return true;
      return row.getValue(id) === value;
    },
  },
  {
    accessorKey: "active_students",
    header: ({ column }) => (
      <button
        className="flex items-center gap-1"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Active Students
        <ArrowUpDown className="h-4 w-4" />
      </button>
    ),
    cell: () => null, // Handled by ClassroomRow
    accessorFn: (row) => row.active_students ?? 0,
  },
  {
    accessorKey: "inactive_students",
    header: ({ column }) => (
      <button
        className="flex items-center gap-1"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Inactive Students
        <ArrowUpDown className="h-4 w-4" />
      </button>
    ),
    cell: () => null, // Handled by ClassroomRow
    accessorFn: (row) => row.inactive_students ?? 0,
  },
  {
    accessorKey: "removed_students",
    header: ({ column }) => (
      <button
        className="flex items-center gap-1"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Removed Students
        <ArrowUpDown className="h-4 w-4" />
      </button>
    ),
    cell: () => null, // Handled by ClassroomRow
    accessorFn: (row) => row.removed_students ?? 0,
  },
];

export default function ClassroomTable({ 
  classrooms, courses, orgs, isOrgAdmin = false 
}: ClassroomTableProps) {
  const [openState, setOpenState] = useState(false);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([
    { id: "status", value: "active" },
    { id: "course_name", value: "all" },
    { id: "organization_name", value: "all" },
  ]);

  // Memoize unique courses and organizations for filter dropdowns
  const uniqueCourses = useMemo(
    () => {
      const courseSet = new Set<string>();
      classrooms.forEach((c) => {
        if (c.course_name) courseSet.add(c.course_name);
      });
      return Array.from(courseSet).sort();
    },
    [classrooms]
  );

  const uniqueOrgs = useMemo(
    () => {
      const orgSet = new Set<string>();
      classrooms.forEach((c) => {
        if (c.organization_name) orgSet.add(c.organization_name);
      });
      return Array.from(orgSet).sort();
    },
    [classrooms]
  );

  const table = useReactTable({
    data: classrooms,
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
  const statusFilter = useMemo(
    () => (columnFilters.find((f) => f.id === "status")?.value as string) ?? "active",
    [columnFilters]
  );

  const courseFilter = useMemo(
    () => (columnFilters.find((f) => f.id === "course_name")?.value as string) ?? "all",
    [columnFilters]
  );

  const orgFilter = useMemo(
    () => (columnFilters.find((f) => f.id === "organization_name")?.value as string) ?? "all",
    [columnFilters]
  );

  // Memoize callbacks
  const handleStatusFilterChange = useCallback(
    (value: string) => {
      table.getColumn("status")?.setFilterValue(value);
    },
    [table]
  );

  const handleCourseFilterChange = useCallback(
    (value: string) => {
      table.getColumn("course_name")?.setFilterValue(value);
    },
    [table]
  );

  const handleOrgFilterChange = useCallback(
    (value: string) => {
      table.getColumn("organization_name")?.setFilterValue(value);
    },
    [table]
  );

  return (
    <div className="space-y-4 w-full min-w-0">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-4 w-full items-stretch sm:items-center">
        <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue>{capitalize(statusFilter)}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>

        <Select value={courseFilter} onValueChange={handleCourseFilterChange}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Filter by course" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Courses</SelectItem>
            {uniqueCourses.map((course) => (
              <SelectItem key={course} value={course}>
                {course}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {!isOrgAdmin && (
          <Select value={orgFilter} onValueChange={handleOrgFilterChange}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Filter by organization" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Organizations</SelectItem>
              {uniqueOrgs.map((org) => (
                <SelectItem key={org} value={org}>
                  {org}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {!isOrgAdmin && (
          <div className="w-full sm:w-auto sm:ml-auto">
            <AddClassroomDialog 
              courses={courses} 
              orgs={orgs}
              openState={openState}
              setOpenState={setOpenState}
            />
          </div>
        )}
      </div>

      {table.getRowModel().rows.length > 0 ? (
        <>
          <div className="w-full min-w-0 -mx-4 sm:mx-0 overflow-x-auto">
          <Table>
            <TableHeader className="bg-primary-foreground">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} className={header.id === "export" ? "w-12" : ""}>
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
                <ClassroomRow key={row.original.classroom_id} classroom={row.original} />
              ))}
            </TableBody>
          </Table>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between px-2">
            <div className="text-muted-foreground text-sm">
              {table.getFilteredRowModel().rows.length} total classrooms
            </div>
            <div className="flex flex-wrap items-center gap-3 sm:gap-6">
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
        <p>NO CLASSROOMS HERE!</p>
      )}
    </div>
  );
}