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
import { Button } from "~/components/ui/button";
import { dateDisplayFormat, formatYen, capitalize } from "~/lib/formatters";
import type { Id } from "convex/_generated/dataModel";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

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

const ORDERS_LIMIT = 5;

export function UserOrdersSection({
  userId,
  orders,
}: {
  userId: Id<"userTable">;
  orders: OrderData[];
}) {
  const displayedOrders = orders.slice(0, ORDERS_LIMIT);
  const hasMore = orders.length > ORDERS_LIMIT;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base sm:text-lg">
          Order Summary ({orders.length} {orders.length === 1 ? "order" : "orders"})
        </CardTitle>
        {hasMore && (
          <Button variant="outline" size="sm" asChild>
            <Link href={`/dashboard/admin/users/${userId}/orders`}>
              See all
              <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {orders.length === 0 ? (
          <p className="text-muted-foreground text-sm py-4">
            No orders for this user.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Order Number</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayedOrders.map((order) => {
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
                          {order.order_number ?? "N/A"}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs">
                          {order.status
                            ? capitalize(order.status)
                            : "N/A"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        {formatYen(displayTotal)}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" asChild>
                          <Link
                            href={`/dashboard/admin/orders/${order.order_id}`}
                            className="text-primary"
                          >
                            View
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
