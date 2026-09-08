"use client";

import * as React from "react";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { RenewalStudentRow } from "./renewalStudentRow";
import type {
  Cart,
  UserWithStudentData,
} from "~/app/dashboard/admin/_actions/schemas";
import type { Id } from "@/convex/_generated/dataModel";
import { api } from "@/convex/_generated/api";
import { useAction, useMutation } from "convex/react";
import { useLocale, useTranslations } from "next-intl";
import { compareStudentExpiry, isRenewable } from "~/lib/dateCompare";
import Link from "next/link";

type Pricing = {
  newStudent: number;
  renewals: { id: Id<"student">; amount: number }[];
  currency: string;
};

export function MemberOrder({
  user,
  cart,
  renderedAt,
}: {
  user: UserWithStudentData;
  cart: Cart | undefined;
  renderedAt: number;
}) {
  const t = useTranslations("dashboard.members.order");
  const locale = useLocale();
  const students = React.useMemo(
    () => [...user.students].sort(compareStudentExpiry),
    [user.students],
  );
  const eligibleIds = React.useMemo(
    () =>
      students
        .filter((student) => isRenewable(60, student.expiry_date, renderedAt))
        .map((student) => student.id),
    [students, renderedAt],
  );
  const [newStudents, setNewStudents] = React.useState(cart?.new_students ?? 0);
  const [existingStudents, setExistingStudents] = React.useState<
    Id<"student">[]
  >(() =>
    [...new Set(cart?.renewal_students ?? [])].filter((id) =>
      eligibleIds.includes(id),
    ),
  );
  const [busy, setBusy] = React.useState(false);
  const saving = React.useRef(false);
  const [error, setError] = React.useState("");
  const [pricing, setPricing] = React.useState<Pricing | null>(null);
  const [pricingFailed, setPricingFailed] = React.useState(false);
  const editCart = useMutation(api.mutations.cart.updateCart);
  const checkout = useAction(api.stripe.checkout);
  const getPricing = useAction(api.stripe.getOrderPricing);

  React.useEffect(() => {
    let cancelled = false;
    void getPricing({ student_ids: eligibleIds })
      .then((result) => {
        if (!cancelled) {
          setPricing(result);
          setPricingFailed(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setPricing(null);
          setPricingFailed(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [getPricing, eligibleIds]);

  async function save(nextNew: number, nextRenewals: Id<"student">[]) {
    if (!cart) throw new Error("Cart not found");
    const result = await editCart({
      user_id: user.id,
      cart_id: cart.cart_id,
      new_students: nextNew,
      renewal_students: nextRenewals,
    });
    if (result !== cart.cart_id) throw new Error("Cart save failed");
  }

  async function change(nextNew: number, nextRenewals: Id<"student">[]) {
    if (saving.current) return;
    saving.current = true;
    setBusy(true);
    setError("");
    const previousNew = newStudents;
    const previousRenewals = existingStudents;
    setNewStudents(nextNew);
    setExistingStudents(nextRenewals);
    try {
      await save(nextNew, nextRenewals);
    } catch {
      setNewStudents(previousNew);
      setExistingStudents(previousRenewals);
      setError(t("save_error"));
    } finally {
      saving.current = false;
      setBusy(false);
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (saving.current || !cart || newStudents + existingStudents.length === 0)
      return;
    saving.current = true;
    setBusy(true);
    setError("");
    try {
      await save(newStudents, existingStudents);
      const url = await checkout({ cart_id: cart.cart_id });
      if (!url?.startsWith("https://")) throw new Error("Checkout failed");
      window.location.href = url;
    } catch {
      setError(t("checkout_error"));
      saving.current = false;
      setBusy(false);
    }
  }

  if (!cart) return <p role="alert">{t("cart_missing")}</p>;
  const total = pricing
    ? newStudents * pricing.newStudent +
      existingStudents.reduce(
        (sum, id) =>
          sum + (pricing.renewals.find((item) => item.id === id)?.amount ?? 0),
        0,
      )
    : null;

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 pb-8 sm:px-6">
      <Link
        href={`/dashboard/members/${user.id}`}
        className="text-primary w-fit text-sm underline underline-offset-4"
      >
        {t("back")}
      </Link>
      <h1 className="text-2xl font-bold">{t("title")}</h1>
      <section
        aria-labelledby="add-heading"
        className="space-y-4 rounded-xl border p-4 sm:p-6"
      >
        <h2 id="add-heading" className="text-lg font-semibold">
          {t("add_title")}
        </h2>
        <p className="text-muted-foreground text-sm">{t("add_description")}</p>
        <div className="flex flex-wrap items-center gap-4">
          <label htmlFor="newStudents" className="font-medium">
            {t("new_count")}
          </label>
          <Input
            id="newStudents"
            name="newStudents"
            type="number"
            min={0}
            max={5}
            step={1}
            className="w-24"
            value={newStudents}
            disabled={busy}
            aria-describedby="new-help"
            onChange={(event) => {
              const value =
                event.target.value === "" ? 0 : event.target.valueAsNumber;
              if (Number.isInteger(value) && value >= 0 && value <= 5)
                void change(value, existingStudents);
            }}
          />
        </div>
        <p id="new-help" className="text-muted-foreground text-sm">
          {t("new_help")}
        </p>
      </section>
      <section
        aria-labelledby="renew-heading"
        className="min-w-0 space-y-4 rounded-xl border p-4 sm:p-6"
      >
        <h2 id="renew-heading" className="text-lg font-semibold">
          {t("renew_title")}
        </h2>
        <p className="text-sm">{t("renew_description")}</p>
        <p id="renewal-help" className="text-muted-foreground text-sm">
          {t("renew_help")}
        </p>
        <p className="font-medium" role="status">
          {eligibleIds.length
            ? t("eligible_count", { count: eligibleIds.length })
            : t("none_eligible")}
        </p>
        {students.length === 0 ? (
          <p className="bg-muted rounded-lg p-4 text-sm">{t("no_students")}</p>
        ) : (
          <Table>
            <caption className="sr-only">{t("sort_description")}</caption>
            <TableHeader>
              <TableRow className="bg-secondary">
                <TableHead scope="col">{t("renew")}</TableHead>
                <TableHead scope="col">{t("username")}</TableHead>
                <TableHead scope="col">{t("status")}</TableHead>
                <TableHead scope="col">{t("classroom")}</TableHead>
                <TableHead scope="col" aria-sort="ascending">
                  {t("expiry")} ↑
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((student) => (
                <RenewalStudentRow
                  key={student.id}
                  student={student}
                  eligible={eligibleIds.includes(student.id)}
                  checked={existingStudents.includes(student.id)}
                  busy={busy}
                  onChange={(id, checked) =>
                    void change(
                      newStudents,
                      checked
                        ? [...existingStudents, id]
                        : existingStudents.filter((value) => value !== id),
                    )
                  }
                />
              ))}
            </TableBody>
          </Table>
        )}
      </section>
      <form
        onSubmit={handleSubmit}
        className="bg-secondary/30 space-y-4 rounded-xl border p-4 sm:p-6"
      >
        <h2 className="text-lg font-semibold">{t("summary")}</h2>
        <div aria-live="polite" aria-atomic="true" className="space-y-2">
          <p>
            {t("selection", {
              newCount: newStudents,
              renewalCount: existingStudents.length,
            })}
          </p>
          <p className="font-semibold">
            {t("total")}:{" "}
            {total !== null && pricing
              ? new Intl.NumberFormat(locale, {
                  style: "currency",
                  currency: pricing.currency,
                }).format(total)
              : t(pricingFailed ? "price_unavailable" : "price_loading")}
          </p>
        </div>
        <p className="text-muted-foreground text-sm">{t("price_note")}</p>
        {error && (
          <p role="alert" className="text-destructive text-sm">
            {error}
          </p>
        )}
        <Button
          type="submit"
          className="w-full sm:w-auto"
          disabled={busy || newStudents + existingStudents.length === 0}
        >
          {busy ? t("working") : t("checkout")}
        </Button>
      </form>
    </div>
  );
}
