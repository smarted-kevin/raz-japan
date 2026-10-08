"use client";

import { useState } from "react";
import { useAction } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { useTranslations } from "next-intl";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { SubscriptionList } from "~/components/billing/subscriptionList";
import { Button } from "~/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "~/components/ui/dialog";
import { dateDisplayFormat, formatYen } from "~/lib/formatters";

export type MemberBillingData = FunctionReturnType<
  typeof api.billingStore.memberBilling
>;

export function MonthlySubscriptionCell({
  studentId,
  data,
}: {
  studentId: Id<"student">;
  data: MemberBillingData | undefined;
}) {
  const t = useTranslations("billing");
  const checkout = useAction(api.subscriptions.createMonthlyCheckout);
  const portal = useAction(api.subscriptions.createBillingPortal);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selection, setSelection] = useState<Id<"course">>();

  if (!data) return <span role="status">{t("loading")}</span>;

  const student = data.students.find((row) => row._id === studentId);
  const subscriptions = data.subscriptions.filter(
    (row) => row.student_id === studentId,
  );
  const availableCourses = data.courses.filter(
    (course) => course.parent_course_id === student?.base_course_id,
  );
  const blocked = subscriptions.some(
    (row) =>
      !["canceled", "incomplete_expired"].includes(row.status) ||
      row.has_access ||
      row.platform_enabled,
  );

  async function purchase(courseId: Id<"course">) {
    setBusy(true);
    setError(false);
    try {
      const result = await checkout({
        student_id: studentId,
        course_id: courseId,
      });
      window.location.assign(result.url);
    } catch {
      setError(true);
      setBusy(false);
    }
  }

  async function openPortal() {
    setBusy(true);
    setError(false);
    try {
      window.location.assign((await portal({})).url);
    } catch {
      setError(true);
      setBusy(false);
    }
  }

  const current = subscriptions.find(
    (row) => !["canceled", "incomplete_expired"].includes(row.status),
  );
  const state = current?.payment_failed
    ? current.has_access
      ? "grace"
      : "payment_trouble"
    : current?.has_access
      ? "paid"
      : current
        ? "processing"
        : undefined;

  return (
    <div className="space-y-2 text-sm">
      {error && (
        <p role="alert" className="text-destructive">
          {t("action_error")}
        </p>
      )}

      {current ? (
        <>
          <div>
            <p className="font-medium">{current.course_name}</p>
            <p className="text-muted-foreground">
              {state && t(state)}
              {current.paid_through &&
                ` · ${t("paid_through")}: ${dateDisplayFormat(current.paid_through)}`}
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setDetailsOpen(true)}
          >
            {t("manage_subscription")}
          </Button>
        </>
      ) : !data.enabled ? (
        <p className="text-muted-foreground">{t("sales_disabled")}</p>
      ) : !student?.eligible ? (
        <p className="text-muted-foreground">{t("annual_required")}</p>
      ) : !blocked && availableCourses.length ? (
        <div className="flex flex-wrap gap-2">
          {availableCourses.map((course) => (
            <Button
              key={course._id}
              type="button"
              size="sm"
              onClick={() => setSelection(course._id)}
            >
              {t("subscribe_short", { course: course.course_name })}
            </Button>
          ))}
        </div>
      ) : !blocked ? (
        <p className="text-muted-foreground">{t("no_addons")}</p>
      ) : (
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => setDetailsOpen(true)}
        >
          {t("manage_subscription")}
        </Button>
      )}

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogTitle>{t("manage_subscription")}</DialogTitle>
          <SubscriptionList rows={subscriptions} />
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={() => void openPortal()}
          >
            {t("manage_payment")}
          </Button>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!selection}
        onOpenChange={(open) => {
          if (!open) setSelection(undefined);
        }}
      >
        <DialogContent>
          <DialogTitle>{t("subscribe")}</DialogTitle>
          <p>{t("checkout_terms")}</p>
          {selection && (
            <p>
              {
                data.courses.find((course) => course._id === selection)
                  ?.course_name
              }
              {" · "}
              {formatYen(
                data.courses.find((course) => course._id === selection)
                  ?.price ?? 0,
              )}{" "}
              {t("per_month")}
            </p>
          )}
          {error && <p role="alert">{t("action_error")}</p>}
          <Button
            type="button"
            disabled={busy}
            onClick={() => selection && void purchase(selection)}
          >
            {t("continue_checkout")}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
