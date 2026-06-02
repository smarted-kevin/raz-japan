"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import type { Id } from "@/convex/_generated/dataModel";
import { addStudentsToClassroom } from "../../../_actions/classroom";
import { useRouter } from "next/navigation";

type AddStudentsForm = {
  student_count: number;
};

export default function AddStudentsDialog({
  classroomId,
  courseId,
  currentStudentCount,
  openState,
  setOpenState,
}: {
  classroomId: Id<"classroom">;
  courseId: Id<"course">;
  currentStudentCount: number;
  openState: boolean;
  setOpenState: (open: boolean) => void;
}) {
  const t = useTranslations("dashboard.admin.classrooms");
  const tc = useTranslations("dashboard.admin.common");
  const router = useRouter();
  const [error, setError] = React.useState<string>();
  const maxAllowed = 36 - currentStudentCount;

  const addStudentsSchema = React.useMemo(
    () =>
      z.object({
        student_count: z
          .number()
          .min(1, t("error_min_students"))
          .max(36, t("error_max_students")),
      }),
    [t]
  );

  const form = useForm<AddStudentsForm>({
    resolver: zodResolver(addStudentsSchema),
    defaultValues: {
      student_count: 1,
    },
  });

  const studentCount = form.watch("student_count");

  React.useEffect(() => {
    if (studentCount > maxAllowed) {
      form.setError("student_count", {
        type: "manual",
        message: t("error_cannot_add_students", {
          count: studentCount,
          current: currentStudentCount,
          max: maxAllowed,
        }),
      });
    } else {
      form.clearErrors("student_count");
    }
  }, [studentCount, maxAllowed, currentStudentCount, form, t]);

  async function onSubmit(values: AddStudentsForm) {
    if (values.student_count > maxAllowed) {
      setError(
        t("error_cannot_add_students", {
          count: values.student_count,
          current: currentStudentCount,
          max: maxAllowed,
        })
      );
      return;
    }

    setError(undefined);
    const result = await addStudentsToClassroom(
      classroomId,
      courseId,
      values.student_count
    );

    if (typeof result === "string") {
      setError(result);
    } else {
      setError(undefined);
      setOpenState(false);
      form.reset();
      router.refresh();
    }
  }

  return (
    <Dialog open={openState} onOpenChange={setOpenState}>
      <DialogTrigger className="w-min" asChild>
        <Button>{t("add_students")}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle className="font-bold">{t("add_students_to_classroom")}</DialogTitle>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="flex flex-col gap-y-4">
              {error && <p className="text-destructive">{error}</p>}
              <div className="text-sm text-muted-foreground">
                {t("current_students_count", { current: currentStudentCount })}
              </div>
              <FormField
                control={form.control}
                name="student_count"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex gap-x-4 items-center">
                      <FormLabel>{t("number_of_students")}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          max={maxAllowed}
                          {...field}
                          value={field.value || ""}
                          onChange={(e) => {
                            const value = e.target.value;
                            const numValue =
                              value === "" ? 0 : parseInt(value, 10);
                            if (!isNaN(numValue)) {
                              field.onChange(numValue);
                            }
                          }}
                        />
                      </FormControl>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {t("max_students", { max: maxAllowed })}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={maxAllowed <= 0}>
                {maxAllowed <= 0 ? t("classroom_full") : t("add_students")}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
