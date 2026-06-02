"use client";

import { useMemo, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
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
import { useAdminStatusLabel } from "../../_lib/useAdminStatusLabel";

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

export default function ActivationCodeTable({
  orgId,
  isOrgAdmin,
}: ActivationCodeTableProps) {
  const t = useTranslations("dashboard.admin.activation_codes");
  const tc = useTranslations("dashboard.admin.common");
  const statusLabel = useAdminStatusLabel();

  const columns: ColumnDef<ActivationCodeData>[] = useMemo(
    () => [
      {
        id: "actions",
        header: "",
        cell: () => null,
      },
      {
        accessorKey: "organization_name",
        header: ({ column }) => (
          <button
            className="flex items-center gap-1"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            {t("organization_name")}
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
        accessorKey: "activation_code",
        header: ({ column }) => (
          <button
            className="flex items-center gap-1"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            {t("activation_code")}
            <ArrowUpDown className="h-4 w-4" />
          </button>
        ),
        cell: () => null,
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
            {t("activated_date")}
            <ArrowUpDown className="h-4 w-4" />
          </button>
        ),
        cell: () => null,
        accessorFn: (row) => row.activated_date ?? 0,
      },
      {
        accessorKey: "removed_date",
        header: ({ column }) => (
          <button
            className="flex items-center gap-1"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            {t("removed_date")}
            <ArrowUpDown className="h-4 w-4" />
          </button>
        ),
        cell: () => null,
        accessorFn: (row) => row.removed_date ?? 0,
      },
    ],
    [t, tc]
  );

  const [openState, setOpenState] = useState(false);
  const [sorting, setSorting] = useState<SortingState>([
    { id: "status", desc: true },
  ]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([
    { id: "status", value: "all" },
    { id: "organization_name", value: "all" },
  ]);

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

  const uniqueOrgs = useMemo(() => {
    if (!activationCodes) return [];
    const orgSet = new Set<string>();
    activationCodes.forEach((code) => {
      if (code.organization_name) orgSet.add(code.organization_name);
    });
    return Array.from(orgSet).sort();
  }, [activationCodes]);

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

  const statusFilter = useMemo(
    () =>
      (columnFilters.find((f) => f.id === "status")?.value as string) ?? "all",
    [columnFilters]
  );

  const orgFilter = useMemo(
    () =>
      (columnFilters.find((f) => f.id === "organization_name")?.value as string) ??
      "all",
    [columnFilters]
  );

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

  if (
    activationCodes === undefined ||
    courses === undefined ||
    orgs === undefined
  ) {
    return <div>{tc("loading")}</div>;
  }

  return (
    <div className="space-y-4 w-full min-w-0">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-4 w-full items-stretch sm:items-center">
        <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue>
              {statusFilter === "all"
                ? tc("filter_all_status")
                : statusLabel(statusFilter)}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{tc("all")}</SelectItem>
            <SelectItem value="used">{tc("used")}</SelectItem>
            <SelectItem value="unused">{tc("unused")}</SelectItem>
            <SelectItem value="removed">{tc("removed")}</SelectItem>
          </SelectContent>
        </Select>

        {!isOrgAdmin && (
          <Select value={orgFilter} onValueChange={handleOrgFilterChange}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder={tc("filter_by_organization")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{tc("filter_all_organizations")}</SelectItem>
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
                  <ActivationCodeRow
                    key={row.original.id}
                    code={row.original}
                    isOrgAdmin={isOrgAdmin}
                  />
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between px-2">
            <div className="text-muted-foreground text-sm">
              {t("total_codes", {
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
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center">
                  {t("no_codes")}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
