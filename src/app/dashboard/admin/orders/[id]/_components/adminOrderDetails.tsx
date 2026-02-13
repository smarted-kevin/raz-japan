"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { dateDisplayFormat, formatYen, capitalize } from "~/lib/formatters";
import type { Id } from "convex/_generated/dataModel";
import Link from "next/link";

type StudentOrderData = {
  id: Id<"student_order">;
  amount: number;
  order_id: Id<"full_order">;
  order_type: "new" | "renewal" | "reactivation";
  username: string;
  expiry_date: number | undefined;
  status: "active" | "inactive" | "removed";
  activation_id: Id<"activation_code"> | undefined;
};

type AdminOrderData = {
  order_id: Id<"full_order">;
  order_number: string | undefined;
  created_date: number;
  status: "created" | "pending" | "fulfilled" | "canceled" | undefined;
  total_amount: number;
  user_id: Id<"userTable">;
  email: string | undefined;
  first_name: string | undefined;
  last_name: string | undefined;
  student_orders: StudentOrderData[];
};

export function AdminOrderDetails({ order }: { order: AdminOrderData }) {
  const displayTotal = order.student_orders.some((so) => so.activation_id)
    ? 0
    : order.total_amount;
  const customerName = [order.first_name, order.last_name].filter(Boolean).join(" ") || "—";

  return (
    <div className="space-y-6 print:space-y-4">
      {/* Order & Customer Info - responsive grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <Card className="print:shadow-none print:border">
          <CardHeader className="pb-2 sm:pb-4">
            <CardTitle className="text-base sm:text-lg">Order Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span className="text-muted-foreground">Order Number</span>
              <span className="font-medium">{order.order_number ?? "N/A"}</span>
              <span className="text-muted-foreground">Date</span>
              <span className="font-medium">{dateDisplayFormat(order.created_date)}</span>
              <span className="text-muted-foreground">Status</span>
              <span className="font-medium">{order.status ? capitalize(order.status) : "—"}</span>
            </div>
          </CardContent>
        </Card>
        <Card className="print:shadow-none print:border">
          <CardHeader className="pb-2 sm:pb-4">
            <CardTitle className="text-base sm:text-lg">Customer</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span className="text-muted-foreground">Name</span>
              <span className="font-medium">{customerName}</span>
              <span className="text-muted-foreground">Email</span>
              <span className="font-medium break-all">{order.email ?? "—"}</span>
            </div>
            <div className="pt-2 print:hidden">
              <Link
                href={`/dashboard/admin/users/${order.user_id}`}
                className="text-sm text-primary hover:underline"
              >
                View member profile →
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Students - Table on desktop, cards on mobile */}
      <Card className="print:shadow-none print:border overflow-hidden">
        <CardHeader className="pb-2 sm:pb-4">
          <CardTitle className="text-base sm:text-lg">
            Students ({order.student_orders.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 sm:px-6 sm:pb-6">
          {/* Desktop: Table */}
          <div className="hidden sm:block overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Username</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Expiry Date</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {order.student_orders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      No students in this order.
                    </TableCell>
                  </TableRow>
                ) : (
                  order.student_orders.map((so) => (
                    <TableRow key={so.id}>
                      <TableCell className="font-medium">{so.username}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs">
                          {capitalize(so.order_type)}
                        </span>
                      </TableCell>
                      <TableCell>
                        {so.expiry_date
                          ? dateDisplayFormat(so.expiry_date)
                          : "N/A"}
                      </TableCell>
                      <TableCell className="text-right">{formatYen(so.amount)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          {/* Mobile: Cards */}
          <div className="sm:hidden divide-y">
            {order.student_orders.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground text-sm px-4">
                No students in this order.
              </div>
            ) : (
              order.student_orders.map((so) => (
                <div
                  key={so.id}
                  className="flex justify-between items-start gap-4 px-4 py-3 first:pt-0"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{so.username}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {capitalize(so.order_type)}
                      {so.expiry_date && ` • Expires ${dateDisplayFormat(so.expiry_date)}`}
                    </p>
                  </div>
                  <span className="font-medium text-sm shrink-0">{formatYen(so.amount)}</span>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Order Total */}
      <div className="flex justify-end">
        <div className="w-full max-w-md sm:max-w-xs border-t pt-4">
          <div className="flex justify-between items-center text-lg font-semibold">
            <span>Order Total</span>
            <span>{formatYen(displayTotal)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
