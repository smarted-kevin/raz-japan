"use client";

import { useTranslations } from "next-intl";
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

export function UserOrdersTable({ orders }: { orders: OrderData[] }) {
  const t = useTranslations("dashboard.admin.users");
  const tc = useTranslations("dashboard.admin.common");

  if (orders.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground border rounded-lg">
        {t("no_orders_found")}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto border rounded-lg">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow>
            <TableHead>{tc("date")}</TableHead>
            <TableHead>{tc("order_number")}</TableHead>
            <TableHead>{tc("status")}</TableHead>
            <TableHead>{tc("students")}</TableHead>
            <TableHead className="text-right">{tc("total")}</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => {
            const displayTotal = order.student_orders.some(
              (so) => so.activation_id
            )
              ? 0
              : order.total_amount;
            return (
              <TableRow key={order.order_id}>
                <TableCell className="font-medium">
                  {dateDisplayFormat(order.created_date)}
                </TableCell>
                <TableCell>
                  <Link
                    href={`/dashboard/admin/orders/${order.order_id}`}
                    className="text-primary hover:underline font-medium"
                  >
                    {order.order_number ?? tc("na")}
                  </Link>
                </TableCell>
                <TableCell>
                  <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs">
                    {order.status ? capitalize(order.status) : tc("na")}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    {order.student_orders.map((student_order) => (
                      <div
                        key={student_order.id}
                        className="flex items-center gap-2 text-sm"
                      >
                        <span className="font-medium">
                          {student_order.username}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-muted">
                          {capitalize(student_order.order_type)}
                        </span>
                      </div>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  {formatYen(displayTotal)}
                </TableCell>
                <TableCell>
                  <Link
                    href={`/dashboard/admin/orders/${order.order_id}`}
                    className="text-primary hover:underline text-sm font-medium"
                  >
                    {t("view_details")}
                  </Link>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
