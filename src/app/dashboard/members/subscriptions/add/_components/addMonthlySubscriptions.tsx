"use client";

import { useEffect, useState } from "react";
import { useAction, useQuery } from "convex/react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { dateDisplayFormat, formatYen } from "~/lib/formatters";

export function AddMonthlySubscriptions() {
  const t = useTranslations("billing");
  const data = useQuery(api.billingStore.memberBilling);
  const canceled = useSearchParams().get("canceled");
  const saved = useQuery(
    api.billingStore.batchStatus,
    canceled ? { id: canceled as Id<"monthly_checkout_batch"> } : "skip",
  );
  const checkout = useAction(api.subscriptions.createMonthlyBatchCheckout);
  const abandon = useAction(api.subscriptions.abandonMonthlyBatch);
  const [selected, setSelected] = useState<Record<string, Id<"course"> | "">>(
    {},
  );
  const [accepted, setAccepted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const [restored, setRestored] = useState<string>();
  const [restoreRetry, setRestoreRetry] = useState(0);

  useEffect(() => {
    if (!canceled || !saved || restored === canceled) return;
    let mounted = true;
    async function restore() {
      try {
        const result = await abandon({
          id: canceled as Id<"monthly_checkout_batch">,
        });
        if (!mounted) return;
        if (result.paid) {
          window.location.replace(
            `/dashboard/members/checkout/success?batch=${encodeURIComponent(canceled!)}`,
          );
          return;
        }
        setSelected(
          Object.fromEntries(
            saved!.selections.map((s) => [s.student_id, s.course_id]),
          ),
        );
        setRestored(canceled!);
        sessionStorage.removeItem("monthly-checkout-batch");
      } catch {
        if (mounted) setError(true);
      }
    }
    void restore();
    return () => {
      mounted = false;
    };
  }, [abandon, canceled, saved, restored, restoreRetry]);

  useEffect(() => {
    const pending = sessionStorage.getItem("monthly-checkout-batch");
    if (pending && !canceled)
      window.location.replace(
        `/dashboard/members/subscriptions/add?canceled=${encodeURIComponent(pending)}`,
      );
    function onPageShow(event: PageTransitionEvent) {
      if (event.persisted) window.location.reload();
    }
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, [canceled]);

  const students = data?.students ?? [];
  const eligible = students.filter((s) => !s.eligibility_reason);
  const entries = Object.entries(selected);
  const invalid =
    entries.length > 100 ||
    entries.some(
      ([id, course]) =>
        !eligible.some(
          (s) =>
            s._id === id &&
            s.compatible_course_ids.includes(course as Id<"course">),
        ),
    );
  const total = entries.reduce(
    (sum, [, id]) =>
      sum + (data?.courses.find((c) => c._id === id)?.price ?? 0),
    0,
  );
  const restoring = !!canceled && restored !== canceled;
  async function purchase() {
    if (invalid || !accepted || !entries.length) return;
    setBusy(true);
    setError(false);
    try {
      const result = await checkout({
        selections: entries.map(([student_id, course_id]) => ({
          student_id: student_id as Id<"student">,
          course_id: course_id as Id<"course">,
        })),
      });
      sessionStorage.setItem("monthly-checkout-batch", result.batch_id);
      window.location.assign(result.url);
    } catch {
      setError(true);
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-4xl space-y-6">
      <h1 className="text-2xl font-semibold">
        {t("add_monthly_subscriptions")}
      </h1>
      <p>{t("batch_intro")}</p>
      <Link href="/dashboard/members" className="text-primary underline">
        {t("back_members")}
      </Link>
      {error && (
        <p role="alert" className="text-destructive">
          {t("action_error")}
        </p>
      )}
      {restoring && error && (
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setError(false);
            setRestoreRetry((value) => value + 1);
          }}
        >
          {t("retry_checkout")}
        </Button>
      )}
      {!data || restoring ? (
        <p role="status">{t("loading")}</p>
      ) : !data.enabled ? (
        <p>{t("sales_disabled")}</p>
      ) : !students.length ? (
        <p>{t("batch_empty")}</p>
      ) : (
        <>
          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              variant="outline"
              disabled={busy || !eligible.length}
              onClick={() =>
                setSelected(
                  Object.fromEntries(
                    eligible.map((s) => [
                      s._id,
                      selected[s._id] ??
                        (s.compatible_course_ids.length === 1
                          ? s.compatible_course_ids[0]!
                          : ""),
                    ]),
                  ),
                )
              }
            >
              {t("select_all_eligible")}
            </Button>
            {entries.length > 0 && (
              <Button
                type="button"
                variant="outline"
                disabled={busy}
                onClick={() => setSelected({})}
              >
                {t("deselect_all")}
              </Button>
            )}
          </div>
          <div className="space-y-3">
            {students.map((student) => {
              const included = Object.hasOwn(selected, student._id);
              return (
                <Card key={student._id}>
                  <CardContent className="flex flex-col gap-3 pt-6 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-1">
                      <label className="flex items-center gap-3 font-medium">
                        <input
                          type="checkbox"
                          className="accent-primary size-4 focus-visible:outline-2 focus-visible:outline-offset-2"
                          checked={included}
                          disabled={
                            busy || (!included && !!student.eligibility_reason)
                          }
                          onChange={(event) =>
                            setSelected((previous) => {
                              const next = { ...previous };
                              if (event.target.checked)
                                next[student._id] =
                                  student.compatible_course_ids.length === 1
                                    ? student.compatible_course_ids[0]!
                                    : "";
                              else delete next[student._id];
                              return next;
                            })
                          }
                        />
                        {student.username}
                      </label>
                      <p className="text-muted-foreground text-sm">
                        {t("annual_expiry")}:{" "}
                        {student.expiry_date
                          ? dateDisplayFormat(student.expiry_date)
                          : t("none")}
                      </p>
                      {student.eligibility_reason && (
                        <p className="text-muted-foreground text-sm">
                          {t(student.eligibility_reason)}
                        </p>
                      )}
                    </div>
                    {included && !student.eligibility_reason && (
                      <Select
                        value={selected[student._id] || undefined}
                        disabled={busy}
                        onValueChange={(value) =>
                          setSelected((previous) => ({
                            ...previous,
                            [student._id]: value as Id<"course">,
                          }))
                        }
                      >
                        <SelectTrigger
                          className="w-full sm:w-72"
                          aria-label={t("choose_product_for", {
                            student: student.username,
                          })}
                        >
                          <SelectValue placeholder={t("choose_product")} />
                        </SelectTrigger>
                        <SelectContent>
                          {data.courses
                            .filter((c) =>
                              student.compatible_course_ids.includes(c._id),
                            )
                            .map((course) => (
                              <SelectItem key={course._id} value={course._id}>
                                {course.course_name} · {formatYen(course.price)}{" "}
                                {t("per_month")}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
          {!eligible.length && <p>{t("batch_no_eligible")}</p>}
          <Card>
            <CardContent className="space-y-4 pt-6">
              <p aria-live="polite">
                {t("selected_count", { count: entries.length })}
              </p>
              <ul className="space-y-1">
                {entries.map(([id, course]) => (
                  <li key={id}>
                    {students.find((s) => s._id === id)?.username} ·{" "}
                    {data.courses.find((c) => c._id === course)?.course_name ??
                      t("choose_product")}{" "}
                    ·{" "}
                    {formatYen(
                      data.courses.find((c) => c._id === course)?.price ?? 0,
                    )}
                  </li>
                ))}
              </ul>
              <p className="text-lg font-semibold">
                {t("first_month_total")}: {formatYen(total)}
              </p>
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  className="accent-primary mt-1 size-4 shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2"
                  checked={accepted}
                  disabled={busy}
                  onChange={(e) => setAccepted(e.target.checked)}
                />
                <span>{t("batch_terms")}</span>
              </label>
              {invalid && <p role="alert">{t("batch_selection_invalid")}</p>}
              {entries.length > 100 && <p role="alert">{t("batch_limit")}</p>}
              <Button
                type="button"
                disabled={busy || !accepted || !entries.length || invalid}
                onClick={() => void purchase()}
              >
                {t(busy ? "loading" : "continue_checkout")}
              </Button>
            </CardContent>
          </Card>
        </>
      )}
    </main>
  );
}
