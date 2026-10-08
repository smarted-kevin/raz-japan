"use client";

import { useEffect } from "react";
import { useQuery } from "convex/react";
import { useTranslations } from "next-intl";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

export function BatchCheckoutStatus({
  batchId,
}: {
  batchId: Id<"monthly_checkout_batch">;
}) {
  const t = useTranslations("billing");
  const data = useQuery(api.billingStore.batchStatus, { id: batchId });
  useEffect(() => {
    sessionStorage.removeItem("monthly-checkout-batch");
  }, []);
  if (!data) return <p role="status">{t("loading")}</p>;
  return (
    <div className="space-y-4" aria-live="polite">
      <h1 className="text-2xl font-bold">
        {t(
          data.status === "expired"
            ? "checkout_expired"
            : data.paid
              ? "batch_payment_confirmed"
              : "processing",
        )}
      </h1>
      <p>{t("checkout_status_note")}</p>
      {data.error && (
        <p role="alert" className="text-destructive">
          {t("checkout_issue")}
        </p>
      )}
      <ul className="space-y-2">
        {data.students.map((student) => (
          <li key={student.student_id}>
            {student.student_name} · {student.course_name} ·{" "}
            {t(
              student.subscription?.paid_through
                ? student.subscription.platform_enabled
                  ? "payment_confirmed"
                  : "activation_pending"
                : "processing",
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
