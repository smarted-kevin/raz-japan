"use client";
import { useQuery } from "convex/react";
import { useTranslations } from "next-intl";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
export function CheckoutStatus({
  attemptId,
}: {
  attemptId: Id<"monthly_checkout">;
}) {
  const t = useTranslations("billing");
  const data = useQuery(api.billingStore.checkoutStatus, {
    attempt_id: attemptId,
  });
  if (!data) return <p role="status">{t("loading")}</p>;
  const key =
    data.status === "expired"
      ? "checkout_expired"
      : data.subscription?.paid_through
        ? data.subscription.platform_enabled
          ? "payment_confirmed"
          : "activation_pending"
        : data.subscription?.payment_failed
          ? "payment_trouble"
          : "processing";
  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-bold">{t(key)}</h1>
      <p>{t("checkout_status_note")}</p>
      {data.error && <p role="alert">{t("checkout_issue")}</p>}
    </div>
  );
}
