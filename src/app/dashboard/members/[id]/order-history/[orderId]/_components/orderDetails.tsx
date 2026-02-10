"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { dateDisplayFormat, formatYen } from "~/lib/formatters";
import type { Id } from "convex/_generated/dataModel";

type StudentOrderData = {
  id: Id<"student_order">;
  amount: number;
  order_id: Id<"full_order">;
  order_type: "new" | "renewal" | "reactivation";
  username: string;
  expiry_date: number | undefined;
  activation_id: Id<"activation_code"> | undefined;
};

type OrderData = {
  order_id: Id<"full_order">;
  total_amount: number;
  order_number: string | undefined;
  created_date: number;
  status: "created" | "pending" | "fulfilled" | "canceled" | undefined;
  user_id: Id<"userTable">;
  student_orders: StudentOrderData[];
};

export function OrderDetails({ order }: { order: OrderData }) {
  // Calculate display total (0 if any student has activation_id, otherwise total_amount)
  const displayTotal = order.student_orders.some((so) => so.activation_id)
    ? 0
    : order.total_amount;

  return (
    <div className="space-y-6 print:space-y-4">
      {/* Order Header */}
      <div className="space-y-2 print:mb-4 print:border-b print:pb-4">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-bold print:text-2xl">Order Receipt</h2>
            <p className="text-sm text-muted-foreground mt-1 print:text-base print:text-black">
              Order Number: <span className="font-medium">{order.order_number ?? "N/A"}</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground print:text-base print:text-black">Order Date</p>
            <p className="font-medium print:text-lg">{dateDisplayFormat(order.created_date)}</p>
          </div>
        </div>
      </div>

      {/* Students Table */}
      <div className="border rounded-lg overflow-hidden print:border print:rounded">
        <Table>
          <TableHeader className="bg-primary-foreground print:bg-gray-100">
            <TableRow className="print:border-b">
              <TableHead className="print:font-bold print:text-black">Username</TableHead>
              <TableHead className="print:font-bold print:text-black">Expiry Date</TableHead>
              <TableHead className="text-right print:font-bold print:text-black">Price</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {order.student_orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground py-8 print:text-black">
                  No students found in this order.
                </TableCell>
              </TableRow>
            ) : (
              order.student_orders.map((student_order) => (
                <TableRow key={student_order.id} className="print:border-b">
                  <TableCell className="font-medium print:text-black">{student_order.username}</TableCell>
                  <TableCell className="print:text-black">
                    {student_order.expiry_date
                      ? dateDisplayFormat(student_order.expiry_date)
                      : "N/A"}
                  </TableCell>
                  <TableCell className="text-right print:text-black print:font-medium">
                    {formatYen(student_order.amount)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Order Total */}
      <div className="flex justify-end print:mt-6">
        <div className="w-full max-w-md space-y-2 border-t pt-4 print:border-t-2 print:border-black">
          <div className="flex justify-between items-center text-lg font-bold print:text-xl print:text-black">
            <span>Order Total:</span>
            <span>{formatYen(displayTotal)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
