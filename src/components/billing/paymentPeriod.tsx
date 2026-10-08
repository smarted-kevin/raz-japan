"use client";
import { useTranslations } from "next-intl";
import { dateDisplayFormat } from "~/lib/formatters";
export type PaymentSnapshot = {
  billing_model?: "annual_purchase" | "monthly_subscription";
  course_name?: string;
  period_start?: number;
  period_end?: number;
};
export function PaymentPeriod({ payment }: { payment: PaymentSnapshot }) {
  const t = useTranslations("billing");
  return (
    <div className="text-sm">
      <p>
        {payment.course_name} ·{" "}
        {t(
          payment.billing_model === "monthly_subscription"
            ? "monthly_payment"
            : "annual_payment",
        )}
      </p>
      {payment.period_start !== undefined &&
        payment.period_end !== undefined && (
          <p>
            {t("period")}: {dateDisplayFormat(payment.period_start)} –{" "}
            {dateDisplayFormat(payment.period_end)}
          </p>
        )}
    </div>
  );
}
export function InvoiceReference({ invoiceId }: { invoiceId?: string }) {
  const t = useTranslations("billing");
  return invoiceId ? (
    <p className="text-sm break-all">
      {t("invoice")}: {invoiceId}
    </p>
  ) : null;
}
