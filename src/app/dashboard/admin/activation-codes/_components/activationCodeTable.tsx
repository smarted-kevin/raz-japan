"use client";

import { useMemo, useState, useCallback } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
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
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";
import AddActivationCodeDialog from "./addActivationCodeDialog";
import ActivationCodeRow from "./activationCodeRow";

export type ActivationCodeData = {
  id: Id<"activation_code">;
  activation_code: string;
  organization_id: string;
  organization_name: string;
  activated_date: number | undefined;
  removed_date: number | undefined;
  created_date: number;
};

type Status = "used" | "unused" | "removed" | "all";

interface ActivationCodeTableProps {
  orgId?: Id<"organization">;
  isOrgAdmin: boolean;
}

function getStatus(code: ActivationCodeData): Status {
  if (code.removed_date) return "removed";
  if (code.activated_date) return "used";
  return "unused";
}

const columns: ColumnDef<ActivationCodeData>[] = [
  {
    id: "actions",
    header: "",
    cell: () => null, // Handled by ActivationCodeRow
  },
  {
    accessorKey: "organization_name",
    header: ({ column }) => (
      <button
        className="flex items-center gap-1"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Organization Name
        <ArrowUpDown className="h-4 w-4" />
      </button>
    ),
    cell: () => null, // Handled by ActivationCodeRow
    filterFn: (row, id, value: string) => {
      if (value === "all") return true;
      return row.getValue(id) === value;
    },
  },
  {
    accessorKey: "activation_code",
    header: ({ column }) => (
      <button
        className="flex items-center gap-1"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Activation Code
        <ArrowUpDown className="h-4 w-4" />
      </button>
    ),
    cell: () => null, // Handled by ActivationCodeRow
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
    cell: () => null, // Handled by ActivationCodeRow
    accessorFn: (row) => getStatus(row),
    filterFn: (row, id, value: string) => {
      if (value === "all") return true;
      return row.getValue(id) === value;
    },
  },
  {
    accessorKey: "activated_date",
    header: ({ column }) => (
      <button
        className="flex items-center gap-1"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Activated Date
        <ArrowUpDown className="h-4 w-4" />
      </button>
    ),
    cell: () => null, // Handled by ActivationCodeRow
    accessorFn: (row) => row.activated_date ?? 0,
  },
  {
    accessorKey: "removed_date",
    header: ({ column }) => (
      <button
        className="flex items-center gap-1"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Removed Date
        <ArrowUpDown className="h-4 w-4" />
      </button>
    ),
    cell: () => null, // Handled by ActivationCodeRow
    accessorFn: (row) => row.removed_date ?? 0,
  },
];

export default function ActivationCodeTable({ orgId, isOrgAdmin }: ActivationCodeTableProps) {
  const [openState, setOpenState] = useState(false);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([
    { id: "status", value: "all" },
    { id: "organization_name", value: "all" },
  ]);

  // Use reactive queries that automatically update when data changes
  // For org_admin, use the organization-filtered query
  const allActivationCodes = useQuery(
    api.queries.activation_code.getAllActivationCodes,
    isOrgAdmin ? "skip" : undefined
  );
  const orgActivationCodes = useQuery(
    api.queries.activation_code.getActivationCodesByOrganization,
    isOrgAdmin && orgId ? { org_id: orgId } : "skip"
  );
  
  const activationCodes = isOrgAdmin ? orgActivationCodes : allActivationCodes;
  const courses = useQuery(api.queries.course.getAllCourses);
  const orgs = useQuery(api.queries.organization.getAllOrganizations);

  // Memoize unique organizations for filter dropdown (handle undefined case)
  const uniqueOrgs = useMemo(
    () => {
      if (!activationCodes) return [];
      const orgSet = new Set<string>();
      activationCodes.forEach((code) => {
        if (code.organization_name) orgSet.add(code.organization_name);
      });
      return Array.from(orgSet).sort();
    },
    [activationCodes]
  );

  // Use empty array as fallback for table data
  const tableData = activationCodes ?? [];

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

  // Memoize filter values
  const statusFilter = useMemo(
    () => (columnFilters.find((f) => f.id === "status")?.value as string) ?? "all",
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

  const handleOrgFilterChange = useCallback(
    (value: string) => {
      table.getColumn("organization_name")?.setFilterValue(value);
    },
    [table]
  );

  // Show loading state while data is being fetched (after all hooks)
  if (activationCodes === undefined || courses === undefined || orgs === undefined) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-4 w-full items-center flex-wrap">
        <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
          <SelectTrigger className="w-[150px]">
            <SelectValue>
              {statusFilter === "all" ? "All Status" : statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="used">Used</SelectItem>
            <SelectItem value="unused">Unused</SelectItem>
            <SelectItem value="removed">Removed</SelectItem>
          </SelectContent>
        </Select>

        {!isOrgAdmin && (
          <Select value={orgFilter} onValueChange={handleOrgFilterChange}>
            <SelectTrigger className="w-[200px]">
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
          <div className="ml-auto">
            <AddActivationCodeDialog
              courses={courses ?? []}
              orgs={orgs ?? []}
              openState={openState}
              setOpenState={setOpenState}
            />
          </div>
        )}
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
                <ActivationCodeRow 
                  key={row.original.id} 
                  code={row.original}
                  isOrgAdmin={isOrgAdmin}
                />
              ))}
            </TableBody>
          </Table>

          <div className="flex items-center justify-between px-2">
            <div className="text-muted-foreground text-sm">
              {table.getFilteredRowModel().rows.length} total activation codes
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
            <TableRow>
              <TableCell colSpan={columns.length} className="text-center">
                No activation codes found
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      )}
    </div>
  );
}
