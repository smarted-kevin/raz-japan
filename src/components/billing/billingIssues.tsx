"use client";
import { useQuery } from "convex/react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { api } from "@/convex/_generated/api";
export function BillingIssues() {
  const t = useTranslations("billing");
  const issues = useQuery(api.billingStore.billingIssues);
  if (!issues) return <p role="status">{t("loading")}</p>;
  const hasIssues =
    issues.courses.length > 0 ||
    issues.subscriptions.length > 0 ||
    issues.checkouts.length > 0;
  return (
    <section
      aria-labelledby="billing-attention-heading"
      className="space-y-2 rounded border p-4 text-sm"
    >
      <h2 id="billing-attention-heading" className="text-lg font-semibold">
        {t("needs_attention")}
      </h2>
      {issues.activation_tasks_count > 0 && (
        <p>
          <Link
            className="text-primary underline"
            href="/dashboard/admin/subscriptions?tasks=true"
          >
            {t("task_count", { count: issues.activation_tasks_count })}
          </Link>
        </p>
      )}
      {!hasIssues && issues.activation_tasks_count === 0 && (
        <p>{t("nothing_needs_attention")}</p>
      )}
      {hasIssues && (
        <details>
          <summary className="cursor-pointer rounded focus-visible:outline-2 focus-visible:outline-offset-2">
            {t("review_billing_issues", {
              count:
                issues.courses.length +
                issues.subscriptions.length +
                issues.checkouts.length,
            })}
          </summary>
          <ul className="mt-2 list-disc space-y-2 pl-5">
            {issues.courses.map((course) => (
              <li key={course._id}>
                <Link
                  className="text-primary underline"
                  href={"/dashboard/admin/courses/" + course._id}
                >
                  {course.course_name}
                </Link>{" "}
                ·{" "}
                {t(
                  course.provisioning_state === "pending"
                    ? "setup_pending"
                    : "provisioning_error",
                )}
              </li>
            ))}
            {issues.subscriptions.map((subscription) => (
              <li key={subscription._id}>
                <Link
                  className="text-primary underline"
                  href={
                    "/dashboard/admin/subscriptions?student=" +
                    subscription.student_id
                  }
                >
                  {subscription.stripe_subscription_id}
                </Link>{" "}
                · {t("reconciliation_error")}
              </li>
            ))}
            {issues.checkouts.map((attempt) => (
              <li key={attempt._id}>
                <Link
                  className="text-primary underline"
                  href={"/dashboard/admin/users/" + attempt.user_id}
                >
                  {t("review_checkout_member")}
                </Link>{" "}
                · {t("checkout_issue")} ({attempt._id})
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}
