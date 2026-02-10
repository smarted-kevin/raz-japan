"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { dateDisplayFormat, formatYen, capitalize } from "~/lib/formatters";
import type { Id } from "convex/_generated/dataModel";
import Link from "next/link";

type StudentOrderData = {
  id: Id<"student_order">;
  amount: number;
  order_id: Id<"full_order">;
  order_type: "new" | "renewal" | "reactivation";
  username: string;
  activation_id: Id<"activation_code"> | undefined;
};

type OrderData = {
  order_id: Id<"full_order">;
  total_amount: number;
  order_number: string | undefined;
  created_date: number;
  status: "created" | "pending" | "fulfilled" | "canceled" | undefined;
  student_orders: StudentOrderData[];
};

export function OrderHistoryTable({ orders, userId }: { orders: OrderData[]; userId: Id<"userTable"> }) {
  if (orders.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No orders found.
      </div>
    );
  }

  return (
    <Table>
      <TableHeader className="bg-primary-foreground">
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Order Number</TableHead>
          <TableHead>Total Amount</TableHead>
          <TableHead>Students</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {orders.map((order) => (
          <TableRow key={order.order_id}>
            <TableCell className="font-medium">
              {dateDisplayFormat(order.created_date)}
            </TableCell>
            <TableCell>
              <Link
                href={`/dashboard/members/${userId}/order-history/${order.order_id}`}
                className="text-primary hover:underline font-medium"
              >
                {order.order_number ?? "N/A"}
              </Link>
            </TableCell>
            <TableCell>
              {order.student_orders.some((so) => so.activation_id)
                ? formatYen(0)
                : formatYen(order.total_amount)}
            </TableCell>
            <TableCell>
              <div className="flex flex-col gap-1">
                {order.student_orders.map((student_order) => (
                  <div
                    key={student_order.id}
                    className="flex items-center gap-2 text-sm"
                  >
                    <span className="font-medium">{student_order.username}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-muted">
                      {capitalize(student_order.order_type)}
                    </span>
                  </div>
                ))}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
