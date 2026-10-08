"use client";
import {
  PaymentPeriod,
  InvoiceReference,
  type PaymentSnapshot,
} from "~/components/billing/paymentPeriod";

import { useTranslations } from "next-intl";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { dateDisplayFormat, formatYen, capitalize } from "~/lib/formatters";
import type { Id } from "@/convex/_generated/dataModel";
import Link from "next/link";

type StudentOrderData = PaymentSnapshot & {
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
  stripe_invoice_id?: string;
  user_id: Id<"userTable">;
  email: string | undefined;
  first_name: string | undefined;
  last_name: string | undefined;
  student_orders: StudentOrderData[];
};

export function AdminOrderDetails({ order }: { order: AdminOrderData }) {
  const t = useTranslations("dashboard.admin.orders");
  const tc = useTranslations("dashboard.admin.common");
  const displayTotal = order.student_orders.some((so) => so.activation_id)
    ? 0
    : order.total_amount;
  const customerName =
    [order.first_name, order.last_name].filter(Boolean).join(" ") || "—";

  return (
    <div className="space-y-6 print:space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
        <Card className="print:border print:shadow-none">
          <CardHeader className="pb-2 sm:pb-4">
            <CardTitle className="text-base sm:text-lg">
              {t("order_information")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span className="text-muted-foreground">
                {tc("order_number")}
              </span>
              <span className="font-medium">
                {order.order_number ?? tc("na")}
              </span>
              <span className="text-muted-foreground">{tc("date")}</span>
              <span className="font-medium">
                {dateDisplayFormat(order.created_date)}
              </span>
              <span className="text-muted-foreground">{tc("status")}</span>
              <span className="font-medium">
                {order.status ? capitalize(order.status) : "—"}
              </span>
            </div>
          </CardContent>
        </Card>
        <Card className="print:border print:shadow-none">
          <CardHeader className="pb-2 sm:pb-4">
            <CardTitle className="text-base sm:text-lg">
              {t("customer")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span className="text-muted-foreground">{tc("name")}</span>
              <span className="font-medium">{customerName}</span>
              <span className="text-muted-foreground">{tc("email")}</span>
              <span className="font-medium break-all">
                {order.email ?? "—"}
              </span>
            </div>
            <div className="pt-2 print:hidden">
              <Link
                href={`/dashboard/admin/users/${order.user_id}`}
                className="text-primary text-sm hover:underline"
              >
                {t("view_member_profile")}
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden print:border print:shadow-none">
        <CardHeader className="pb-2 sm:pb-4">
          <CardTitle className="text-base sm:text-lg">
            {tc("students")} ({order.student_orders.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 sm:px-6 sm:pb-6">
          <div className="hidden overflow-x-auto sm:block">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>{tc("username")}</TableHead>
                  <TableHead>{t("type")}</TableHead>
                  <TableHead>{tc("expiry_date")}</TableHead>
                  <TableHead className="text-right">{tc("price")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {order.student_orders.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-muted-foreground py-8 text-center"
                    >
                      {t("no_students_in_order")}
                    </TableCell>
                  </TableRow>
                ) : (
                  order.student_orders.map((so) => (
                    <TableRow key={so.id}>
                      <TableCell className="font-medium">
                        {so.username}
                        <PaymentPeriod payment={so} />
                      </TableCell>
                      <TableCell>
                        <span className="bg-muted inline-flex items-center rounded-full px-2 py-0.5 text-xs">
                          {so.billing_model === "monthly_subscription"
                            ? t("type")
                            : capitalize(so.order_type)}
                        </span>
                      </TableCell>
                      <TableCell>
                        {so.expiry_date
                          ? dateDisplayFormat(so.expiry_date)
                          : tc("na")}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatYen(so.amount)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          <div className="divide-y sm:hidden">
            {order.student_orders.length === 0 ? (
              <div className="text-muted-foreground px-4 py-8 text-center text-sm">
                {t("no_students_in_order")}
              </div>
            ) : (
              order.student_orders.map((so) => (
                <div
                  key={so.id}
                  className="flex items-start justify-between gap-4 px-4 py-3 first:pt-0"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{so.username}</p>
                    <PaymentPeriod payment={so} />
                    <p className="text-muted-foreground mt-0.5 text-xs">
                      {capitalize(so.order_type)}
                      {so.expiry_date &&
                        ` • ${t("expires", { date: dateDisplayFormat(so.expiry_date) })}`}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-medium">
                    {formatYen(so.amount)}
                  </span>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <InvoiceReference invoiceId={order.stripe_invoice_id} />
      <div className="flex justify-end">
        <div className="w-full max-w-md border-t pt-4 sm:max-w-xs">
          <div className="flex items-center justify-between text-lg font-semibold">
            <span>{tc("order_total")}</span>
            <span>{formatYen(displayTotal)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
