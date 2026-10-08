"use client";
import { useState } from "react";
import { useQuery } from "convex/react";
import { useTranslations } from "next-intl";
import type { Id } from "@/convex/_generated/dataModel";
import { api } from "@/convex/_generated/api";
import { SubscriptionList } from "./subscriptionList";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
export function AdminSubscriptionsPanel({
  userId,
  courseId,
  studentId,
  classroomId,
  initialFilter = "all",
}: {
  userId?: Id<"userTable">;
  courseId?: Id<"course">;
  studentId?: Id<"student">;
  classroomId?: Id<"classroom">;
  initialFilter?: "all" | "tasks";
}) {
  const t = useTranslations("billing");
  const [cursor, setCursor] = useState<string>();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>(initialFilter);
  const data = useQuery(api.billingStore.adminSubscriptions, {
    cursor,
    user_id: userId,
    course_id: courseId,
    student_id: studentId,
    classroom_id: classroomId,
    activation_only: filter === "tasks",
  });
  if (!data) return <p role="status">{t("loading")}</p>;
  const rows = data.page
    .filter((row) =>
      [row.email, row.student_name, row.course_name]
        .join(" ")
        .toLowerCase()
        .includes(search.toLowerCase()),
    )
    .filter(
      (row) =>
        filter === "all" ||
        (filter === "tasks"
          ? row.activation_required
          : filter === "trouble"
            ? row.payment_failed || !!row.reconciliation_error
            : filter === "canceling"
              ? row.cancel_at_period_end
              : filter === "active"
                ? row.has_access
                : ["canceled", "incomplete_expired"].includes(row.status)),
    );
  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold">{t("subscriptions")}</h2>
      <div className="flex flex-wrap gap-3">
        <Input
          aria-label={t("search")}
          placeholder={t("search")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="rounded border p-2"
          aria-label={t("filter")}
          value={filter}
          onChange={(e) => {
            setFilter(e.target.value);
            setCursor(undefined);
          }}
        >
          {["all", "active", "trouble", "canceling", "ended", "tasks"].map(
            (value) => (
              <option key={value} value={value}>
                {t(value)}
              </option>
            ),
          )}
        </select>
      </div>
      <p className="text-muted-foreground text-sm">{t("page_filter_note")}</p>
      <SubscriptionList rows={rows} admin />
      <div className="flex gap-2">
        {cursor && (
          <Button variant="outline" onClick={() => setCursor(undefined)}>
            {t("first_page")}
          </Button>
        )}
        {!data.isDone && (
          <Button onClick={() => setCursor(data.continueCursor)}>
            {t("next_page")}
          </Button>
        )}
      </div>
    </section>
  );
}
