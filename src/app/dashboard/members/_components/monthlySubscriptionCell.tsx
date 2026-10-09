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
  const portal = useAction(api.subscriptions.createBillingPortal);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);

  if (!data) return <span role="status">{t("loading")}</span>;

  const subscriptions = data.subscriptions.filter(
    (row) => row.student_id === studentId,
  );
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

  const current =
    subscriptions.find(
      (row) => !["canceled", "incomplete_expired"].includes(row.status),
    ) ?? subscriptions.at(-1);

  if (!current) return null;

  return (
    <div className="flex min-w-0 items-center gap-3 text-sm">
      <span className="truncate font-medium" title={current.course_name}>
        {current.course_name}
      </span>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="shrink-0"
        onClick={() => setDetailsOpen(true)}
      >
        {t("manage")}
      </Button>

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogTitle>{t("manage_subscription")}</DialogTitle>
          <SubscriptionList rows={subscriptions} />
          {error && (
            <p role="alert" className="text-destructive">
              {t("action_error")}
            </p>
          )}
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={() => void openPortal()}
          >
            {t("member_manage_payment")}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
