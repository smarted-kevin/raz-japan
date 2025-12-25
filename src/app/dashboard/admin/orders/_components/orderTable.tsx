"use client";

import { useState } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTrigger,
} from "~/components/ui/dialog";
import type { OrdersWithUserAndStudentData } from "../../_actions/schemas";
import { dateDisplayFormat } from "~/lib/formatters";

export default function OrderTable({ orders }: { orders: OrdersWithUserAndStudentData[] }) {
  
  const [status, setStatus] = useState("active")

  return (
    <>
      <Select value={status} onValueChange={setStatus}>
        <SelectTrigger className="w-1/2">
          <SelectValue>{status}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="active">active</SelectItem>
          <SelectItem value="inactive">inactive</SelectItem>
          <SelectItem value="removed">removed</SelectItem>
        </SelectContent>
      </Select>
      <Table>
        <TableHeader className="bg-primary-foreground">
          <TableRow>
            <TableHead>Order Number</TableHead>
            <TableHead>User ID</TableHead>
            <TableHead>Order Total</TableHead>
            <TableHead>Created Date</TableHead>
            <TableHead>Student Orders</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow key={order.order_id}>
              <TableCell>{order.order_number ?? "N/A"}</TableCell>
              <TableCell>{order.email}</TableCell>
              <TableCell>{order.amount}</TableCell>
              <TableCell>{dateDisplayFormat(order.created_date)}</TableCell>
              <TableCell>{order.student_orders.map((student_order) => (
                <div key={student_order.id}>
                  {student_order.username}
                  {student_order.amount}
                  {student_order.order_type}
                </div>
              ))}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  )
}