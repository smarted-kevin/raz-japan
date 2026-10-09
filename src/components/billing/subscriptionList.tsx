"use client";
import { useState } from "react";
import { useAction, useMutation, useQuery } from "convex/react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import type { FunctionReturnType } from "convex/server";
import { api } from "@/convex/_generated/api";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Dialog, DialogContent, DialogTitle } from "~/components/ui/dialog";
import { dateDisplayFormat, formatYen } from "~/lib/formatters";

type Subscription = FunctionReturnType<
  typeof api.billingStore.adminSubscriptions
>["page"][number];
type Row = Omit<Subscription, "can_activate"> & { can_activate?: boolean };
export function SubscriptionList({
  rows,
  admin = false,
}: {
  rows: Row[];
  admin?: boolean;
}) {
  const t = useTranslations("billing");
  return (
    <div className="space-y-4">
      {!rows.length && <p>{t("empty")}</p>}
      {rows.map((row) => (
        <SubscriptionCard key={row._id} row={row} admin={admin} />
      ))}
    </div>
  );
}
function SubscriptionCard({ row, admin }: { row: Row; admin: boolean }) {
  const t = useTranslations("billing");
  const cancel = useAction(api.subscriptions.scheduleCancellation);
  const resume = useAction(api.subscriptions.undoCancellation);
  const recover = useAction(api.subscriptions.resolvePayment);
  const acknowledge = useMutation(api.billingStore.acknowledgeActivation);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [history, setHistory] = useState(false);
  const audit = useQuery(
    api.billingStore.activationHistory,
    admin && history ? { subscription_id: row._id } : "skip",
  );
  const ended = ["canceled", "incomplete_expired"].includes(row.status);
  async function run(task: () => Promise<unknown>) {
    setBusy(true);
    setError(false);
    try {
      await task();
      setConfirm(false);
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }
  const state = row.payment_failed
    ? row.has_access
      ? "grace"
      : "payment_trouble"
    : row.has_access
      ? "paid"
      : ended
        ? "ended"
        : "processing";
  return (
    <Card>
      <CardHeader className={admin ? undefined : "gap-3"}>
        <CardTitle>
          {row.course_name} · {row.student_name}
        </CardTitle>
        {!admin && (
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <p className="text-muted-foreground">
              <span className="text-foreground font-semibold">
                {formatYen(row.price)}
              </span>{" "}
              {t("per_month")}
            </p>
            <span className="bg-muted rounded-full px-3 py-1 text-xs font-medium">
              {t(state === "payment_trouble" ? "needs_attention" : state)}
            </span>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {admin ? (
          <>
            <p>
              {formatYen(row.price)} {t("per_month")} · {t(state)}
            </p>
          </>
        ) : (
          <>
            <dl className="grid gap-4 border-y py-4 text-sm sm:grid-cols-2">
              {row.next_billing_at && (
                <div className="space-y-1">
                  <dt className="text-muted-foreground">
                    {t("member_next_payment")}
                  </dt>
                  <dd className="font-medium tabular-nums">
                    {dateDisplayFormat(row.next_billing_at)}
                  </dd>
                </div>
              )}
              <div className="space-y-1">
                <dt className="text-muted-foreground">
                  {t("member_paid_through")}
                </dt>
                <dd className="font-medium tabular-nums">
                  {row.paid_through
                    ? dateDisplayFormat(row.paid_through)
                    : t("none")}
                </dd>
              </div>
            </dl>
            {row.has_access && !row.platform_enabled && (
              <p className="text-muted-foreground text-sm">
                {t("member_activation_pending")}
              </p>
            )}
            {row.payment_failed && (
              <p className="text-sm">{t("payment_trouble")}</p>
            )}
          </>
        )}
        {admin && (
          <p>
            {t("paid_through")}:{" "}
            {row.paid_through ? dateDisplayFormat(row.paid_through) : t("none")}
          </p>
        )}
        {admin && row.next_billing_at && (
          <p>
            {t("next_payment")}: {dateDisplayFormat(row.next_billing_at)}
          </p>
        )}
        {admin && (
          <p>
            {t("annual_expiry")}:{" "}
            {row.annual_expiry
              ? dateDisplayFormat(row.annual_expiry)
              : t("none")}
          </p>
        )}
        {admin && (
          <p>
            {t(
              row.has_access
                ? row.platform_enabled
                  ? "platform_enabled"
                  : "activation_pending"
                : row.platform_enabled
                  ? "deactivation_pending"
                  : "platform_disabled",
            )}
          </p>
        )}
        {row.cancel_at_period_end && (
          <p>
            {t("cancellation_scheduled", {
              date: dateDisplayFormat(row.period_end),
            })}
          </p>
        )}
        {!row.cancel_at_period_end &&
          row.renewal_stop_at &&
          !ended &&
          (admin ? (
            <p>
              {t("annual_stop", {
                date: dateDisplayFormat(row.renewal_stop_at),
              })}
            </p>
          ) : (
            <details className="text-muted-foreground text-sm">
              <summary className="focus-visible:ring-ring cursor-pointer rounded-sm py-1 focus-visible:ring-2 focus-visible:outline-none">
                {t("member_renewal_details")}
              </summary>
              <div className="space-y-2 pt-2 leading-relaxed">
                <p>
                  {t("annual_expiry")}:{" "}
                  {row.annual_expiry
                    ? dateDisplayFormat(row.annual_expiry)
                    : t("none")}
                </p>
                <p>
                  {t("member_annual_stop", {
                    date: dateDisplayFormat(row.renewal_stop_at),
                  })}
                </p>
              </div>
            </details>
          ))}
        {row.payment_failed && row.has_access && row.grace_deadline && (
          <p>
            {t("grace_until", {
              date: dateDisplayFormat(
                Math.max(
                  row.paid_through,
                  Math.min(row.grace_deadline, row.annual_expiry ?? Infinity),
                ),
              ),
            })}
          </p>
        )}
        {admin && (
          <div className="flex flex-wrap gap-3">
            <Link
              className="text-primary underline"
              href={"/dashboard/admin/users/" + row.user_id}
            >
              {row.email}
            </Link>
            <Link
              className="text-primary underline"
              href={"/dashboard/admin/courses/" + row.course_id}
            >
              {t("product")}
            </Link>
            <Link
              className="text-primary underline"
              href={"/dashboard/admin/users/" + row.user_id + "/orders"}
            >
              {t("payments")}
            </Link>
          </div>
        )}
        {row.reconciliation_error && (
          <p role="alert" className="text-destructive">
            {t("reconciliation_error")}
          </p>
        )}
        {error && (
          <p role="alert" className="text-destructive">
            {t("action_error")}
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          {!admin && row.payment_failed && (
            <Button
              disabled={busy}
              onClick={() =>
                void run(async () => {
                  const result = await recover({ subscription_id: row._id });
                  window.location.assign(result.url);
                })
              }
            >
              {t("complete_payment")}
            </Button>
          )}
          {row.can_manage &&
            !ended &&
            (!row.cancel_at_period_end ? (
              <Button
                disabled={busy}
                variant="outline"
                onClick={() => setConfirm(true)}
              >
                {t("cancel")}
              </Button>
            ) : (
              <Button
                disabled={busy || !row.can_resume}
                onClick={() =>
                  void run(() => resume({ subscription_id: row._id }))
                }
              >
                {t("resume")}
              </Button>
            ))}
          {admin && row.can_activate && row.activation_required && (
            <Button
              disabled={busy}
              onClick={() =>
                void run(() =>
                  acknowledge({
                    subscription_id: row._id,
                    enabled: row.has_access,
                  }),
                )
              }
            >
              {t(row.has_access ? "confirm_enabled" : "confirm_disabled")}
            </Button>
          )}
          {admin && (
            <Button variant="outline" onClick={() => setHistory(!history)}>
              {t("activation_history")}
            </Button>
          )}
        </div>
        {row.cancel_at_period_end && !ended && !row.can_resume && (
          <p>{t("annual_required")}</p>
        )}
        {admin && row.can_activate && row.activation_required && (
          <p className="text-muted-foreground text-sm">
            {t("manual_instruction")}
          </p>
        )}
        {history && audit && (
          <ul className="space-y-1">
            {audit.map((event) => (
              <li key={event._id}>
                {dateDisplayFormat(event.created_at)} ·{" "}
                {t(event.enabled ? "platform_enabled" : "platform_disabled")} ·{" "}
                {event.administrator_name || t("administrator")}
              </li>
            ))}
          </ul>
        )}
        <Dialog open={confirm} onOpenChange={setConfirm}>
          <DialogContent>
            <DialogTitle>{t("cancel")}</DialogTitle>
            <p>
              {t("cancel_explanation", {
                date: row.paid_through
                  ? dateDisplayFormat(row.paid_through)
                  : t("none"),
              })}
            </p>
            {error && <p role="alert">{t("action_error")}</p>}
            <Button
              disabled={busy}
              onClick={() =>
                void run(() => cancel({ subscription_id: row._id }))
              }
            >
              {t("confirm_cancel")}
            </Button>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
