"use client";

import { useMemo, useState } from "react";
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
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import Link from "next/link";
import type { OrdersWithUserAndStudentData } from "../../_actions/schemas";
import { dateDisplayFormat } from "~/lib/formatters";
import { useAdminStatusLabel } from "../../_lib/useAdminStatusLabel";

export default function OrderTable({
  orders,
}: {
  orders: OrdersWithUserAndStudentData[];
}) {
  const t = useTranslations("dashboard.admin.orders");
  const tc = useTranslations("dashboard.admin.common");
  const statusLabel = useAdminStatusLabel();

  const columns: ColumnDef<OrdersWithUserAndStudentData>[] = useMemo(
    () => [
      {
        accessorKey: "order_number",
        header: ({ column }) => (
          <button
            className="flex items-center gap-1"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            {tc("order_number")}
            <ArrowUpDown className="h-4 w-4" />
          </button>
        ),
        cell: ({ row }) => (
          <Link
            href={`/dashboard/admin/orders/${row.original.order_id}`}
            className="text-primary hover:underline font-medium"
          >
            {row.original.order_number ?? tc("na")}
          </Link>
        ),
      },
      {
        accessorKey: "email",
        header: ({ column }) => (
          <button
            className="flex items-center gap-1"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            {t("user_id")}
            <ArrowUpDown className="h-4 w-4" />
          </button>
        ),
      },
      {
        accessorKey: "amount",
        header: ({ column }) => (
          <button
            className="flex items-center gap-1"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            {tc("order_total")}
            <ArrowUpDown className="h-4 w-4" />
          </button>
        ),
      },
      {
        accessorKey: "created_date",
        header: ({ column }) => (
          <button
            className="flex items-center gap-1"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            {t("created_date")}
            <ArrowUpDown className="h-4 w-4" />
          </button>
        ),
        cell: ({ row }) => dateDisplayFormat(row.original.created_date),
      },
      {
        id: "student_orders",
        header: t("student_orders"),
        cell: ({ row }) =>
          row.original.student_orders.map((so) => (
            <div key={so.id}>
              {so.username} {so.amount} {so.order_type}
            </div>
          )),
      },
    ],
    [t, tc]
  );

  const [status, setStatus] = useState("active");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [userFilter, setUserFilter] = useState("");

  const table = useReactTable({
    data: orders,
    columns,
    state: { sorting, globalFilter: userFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setUserFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: { pageSize: 10 },
    },
  });

  return (
    <div className="space-y-4 w-full min-w-0">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-4">
        <Input
          placeholder={tc("filter_by_user")}
          value={userFilter}
          onChange={(e) => setUserFilter(e.target.value)}
          className="w-full sm:max-w-sm min-w-0"
        />
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue>{statusLabel(status)}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">{tc("active")}</SelectItem>
            <SelectItem value="inactive">{tc("inactive")}</SelectItem>
            <SelectItem value="removed">{tc("removed")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

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
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  {tc("no_results")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between px-2">
        <div className="text-muted-foreground text-sm">
          {t("total_rows", { count: table.getFilteredRowModel().rows.length })}
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
    </div>
  );
}
