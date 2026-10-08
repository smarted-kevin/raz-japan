"use client";
import { useState } from "react";
import { useAction, useMutation, useQuery } from "convex/react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { formatYen } from "~/lib/formatters";
export function CourseManager({ courseId }: { courseId?: Id<"course"> }) {
  const t = useTranslations("billing");
  const courses = useQuery(api.queries.course.adminCourses);
  const create = useAction(api.stripe.createProduct);
  const [open, setOpen] = useState(false);
  const [model, setModel] = useState<
    "annual_purchase" | "monthly_subscription"
  >("annual_purchase");
  const [status, setStatus] = useState("all");
  const [kind, setKind] = useState("all");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  if (!courses) return <p role="status">{t("loading")}</p>;
  const annual = courses.filter(
    (c) => c.billing_model !== "monthly_subscription",
  );
  async function submit(form: React.FormEvent<HTMLFormElement>) {
    form.preventDefault();
    const values = new FormData(form.currentTarget);
    setBusy(true);
    setError(false);
    try {
      const result = await create({
        course_name: String(values.get("name")),
        price: Number(values.get("price")),
        billing_model: model,
        parent_course_id:
          model === "monthly_subscription"
            ? (String(values.get("parent")) as Id<"course">)
            : undefined,
      });
      if (!result.success) {
        setError(true);
        return;
      }
      setOpen(false);
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="space-y-4">
      {!courseId && (
        <>
          <Button
            onClick={() => {
              setError(false);
              setOpen(true);
            }}
          >
            {t("create_course")}
          </Button>
          <div className="flex flex-wrap gap-3">
            <select
              className="rounded border p-2"
              aria-label={t("sales_status")}
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              {["all", "active", "inactive"].map((value) => (
                <option key={value} value={value}>
                  {t(value)}
                </option>
              ))}
            </select>
            <select
              className="rounded border p-2"
              aria-label={t("product_type")}
              value={kind}
              onChange={(e) => setKind(e.target.value)}
            >
              {["all", "annual_purchase", "monthly_subscription"].map(
                (value) => (
                  <option key={value} value={value}>
                    {t(value)}
                  </option>
                ),
              )}
            </select>
          </div>
        </>
      )}
      <div className="-mx-4 overflow-x-auto sm:mx-0">
        <Table>
          <TableHeader className="bg-primary-foreground">
            <TableRow>
              <TableHead>{t("course_name")}</TableHead>
              <TableHead>{t("product_type")}</TableHead>
              <TableHead>{t("price_jpy")}</TableHead>
              <TableHead>{t("sales_status")}</TableHead>
              <TableHead>{t("stripe_setup")}</TableHead>
              <TableHead>{t("actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {courses
              .filter(
                (c) =>
                  (!courseId || c._id === courseId) &&
                  (status === "all" || c.status === status) &&
                  (kind === "all" ||
                    (c.billing_model ?? "annual_purchase") === kind),
              )
              .map((c) => (
                <CourseEditor key={c._id} course={c} courses={courses} />
              ))}
          </TableBody>
        </Table>
      </div>
      <p className="text-muted-foreground text-sm">{t("price_notice")}</p>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogTitle>{t("create_course")}</DialogTitle>
          <form onSubmit={(e) => void submit(e)} className="space-y-4">
            <label className="block">
              {t("course_name")}
              <Input name="name" required maxLength={150} />
            </label>
            <label className="block">
              {t("product_type")}
              <select
                className="w-full rounded border p-2"
                value={model}
                onChange={(e) => setModel(e.target.value as typeof model)}
              >
                <option value="annual_purchase">{t("annual_purchase")}</option>
                <option value="monthly_subscription">
                  {t("monthly_subscription")}
                </option>
              </select>
            </label>
            {model === "monthly_subscription" && (
              <label className="block">
                {t("parent_course")}
                <select
                  className="w-full rounded border p-2"
                  name="parent"
                  required
                >
                  {annual.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.course_name}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <label className="block">
              {t("price_jpy")}
              <Input name="price" type="number" min={1} step={1} required />
            </label>
            <p>{t("immutable_model")}</p>
            {error && (
              <p role="alert" className="text-destructive">
                {t("provisioning_error")}
              </p>
            )}
            <Button
              disabled={
                busy || (model === "monthly_subscription" && !annual.length)
              }
              type="submit"
            >
              {t("save")}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
}
function CourseEditor({
  course,
  courses,
}: {
  course: Doc<"course">;
  courses: Doc<"course">[];
}) {
  const t = useTranslations("billing");
  const edit = useMutation(api.mutations.course.editCourse);
  const rename = useAction(api.stripe.updateCourseDetails);
  const pricing = useAction(api.stripe.updateCoursePricing);
  const retry = useAction(api.stripe.retryCourseProvisioning);
  const attach = useMutation(api.mutations.course.setAddonParent);
  const [name, setName] = useState(course.course_name);
  const [price, setPrice] = useState(
    String(course.pending_price ?? course.price),
  );
  const [parent, setParent] = useState(
    course.parent_course_id ??
      courses.find((c) => c.billing_model !== "monthly_subscription")?._id,
  );
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  async function run(task: () => Promise<unknown>) {
    setBusy(true);
    setError(false);
    try {
      await task();
      return true;
    } catch {
      setError(true);
      return false;
    } finally {
      setBusy(false);
    }
  }
  const monthly = course.billing_model === "monthly_subscription";

  async function save() {
    const saved = await run(async () => {
      await rename({ course_id: course._id, course_name: name });
      if (Number(price) !== course.price || course.pending_price !== undefined)
        await pricing({ course_id: course._id, price: Number(price) });
      if (monthly && !course.parent_course_id && parent)
        await attach({ course_id: course._id, parent_course_id: parent });
    });
    if (saved) setOpen(false);
  }

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      setName(course.course_name);
      setPrice(String(course.pending_price ?? course.price));
      setParent(
        course.parent_course_id ??
          courses.find((c) => c.billing_model !== "monthly_subscription")?._id,
      );
      setError(false);
    }
    setOpen(nextOpen);
  }

  return (
    <TableRow>
      <TableCell className="font-medium">{course.course_name}</TableCell>
      <TableCell className="min-w-52 whitespace-normal">
        <p>{t(monthly ? "monthly_subscription" : "annual_purchase")}</p>
        {course.parent_course_id && (
          <p className="text-muted-foreground text-xs">
            {t("parent_course")}:{" "}
            <Link
              className="underline"
              href={"/dashboard/admin/courses/" + course.parent_course_id}
            >
              {courses.find((c) => c._id === course.parent_course_id)
                ?.course_name ?? t("none")}
            </Link>
          </p>
        )}
      </TableCell>
      <TableCell>
        {formatYen(course.pending_price ?? course.price)}{" "}
        <span className="text-muted-foreground text-xs">
          {t(monthly ? "per_month" : "per_year")}
        </span>
      </TableCell>
      <TableCell>{t(course.status)}</TableCell>
      <TableCell>
        {t(
          course.provisioning_state ??
            (course.stripe_price_id ? "ready" : "failed"),
        )}
      </TableCell>
      <TableCell>
        <Dialog open={open} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button type="button" variant="outline">
              {t("edit")}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("edit_course")}</DialogTitle>
            </DialogHeader>
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                void save();
              }}
            >
              <label className="block space-y-1">
                <span>{t("course_name")}</span>
                <Input
                  value={name}
                  required
                  maxLength={150}
                  onChange={(e) => setName(e.target.value)}
                />
              </label>
              <div className="space-y-1">
                <p>{t("product_type")}</p>
                <p className="text-muted-foreground text-sm">
                  {t(monthly ? "monthly_subscription" : "annual_purchase")}
                </p>
              </div>
              {monthly && !course.parent_course_id && (
                <label className="block space-y-1">
                  <span>{t("parent_course")}</span>
                  <select
                    className="w-full rounded border p-2"
                    value={parent ?? ""}
                    onChange={(e) => setParent(e.target.value as Id<"course">)}
                  >
                    {courses
                      .filter((c) => c.billing_model !== "monthly_subscription")
                      .map((c) => (
                        <option key={c._id} value={c._id}>
                          {c.course_name}
                        </option>
                      ))}
                  </select>
                </label>
              )}
              <label className="block space-y-1">
                <span>{t("price_jpy")}</span>
                <Input
                  type="number"
                  min={1}
                  step={1}
                  value={price}
                  required
                  onChange={(e) => setPrice(e.target.value)}
                />
              </label>
              <p className="text-muted-foreground text-sm">
                {t("price_notice")}
              </p>
              {error && (
                <p role="alert" className="text-destructive text-sm">
                  {t("action_error")}
                </p>
              )}
              <DialogFooter>
                <Button type="submit" disabled={busy}>
                  {t("save")}
                </Button>
              </DialogFooter>
            </form>
            <div className="flex flex-wrap gap-2 border-t pt-4">
              <Button
                type="button"
                variant="outline"
                disabled={busy}
                onClick={() =>
                  void run(() =>
                    edit({
                      id: course._id,
                      status:
                        course.status === "active" ? "inactive" : "active",
                    }),
                  )
                }
              >
                {t(course.status === "active" ? "stop_sales" : "start_sales")}
              </Button>
              {course.provisioning_state !== "ready" && (
                <Button
                  type="button"
                  variant="outline"
                  disabled={busy}
                  onClick={() =>
                    void run(() => retry({ course_id: course._id }))
                  }
                >
                  {t("retry_setup")}
                </Button>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </TableCell>
    </TableRow>
  );
}
