"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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

const addStudentsSchema = z.object({
  student_count: z
    .number()
    .min(1, "Must add at least 1 student")
    .max(36, "Cannot add more than 36 students"),
});

type AddStudentsForm = z.infer<typeof addStudentsSchema>;

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
  const router = useRouter();
  const [error, setError] = React.useState<string>();
  const maxAllowed = 36 - currentStudentCount;

  const form = useForm<AddStudentsForm>({
    resolver: zodResolver(addStudentsSchema),
    defaultValues: {
      student_count: 1,
    },
  });

  // Watch the student_count to update max validation
  const studentCount = form.watch("student_count");

  React.useEffect(() => {
    if (studentCount > maxAllowed) {
      form.setError("student_count", {
        type: "manual",
        message: `Cannot add ${studentCount} students. Maximum allowed: ${maxAllowed} (Current: ${currentStudentCount}, Max: 36)`,
      });
    } else {
      form.clearErrors("student_count");
    }
  }, [studentCount, maxAllowed, currentStudentCount, form]);

  async function onSubmit(values: AddStudentsForm) {
    // Double-check validation on submit
    if (values.student_count > maxAllowed) {
      setError(
        `Cannot add ${values.student_count} students. Maximum allowed: ${maxAllowed} (Current: ${currentStudentCount}, Max: 36)`
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
      // Success case - clear error and close dialog
      setError(undefined);
      setOpenState(false);
      form.reset();
      router.refresh();
    }
  }

  return (
    <Dialog open={openState} onOpenChange={setOpenState}>
      <DialogTrigger className="w-min" asChild>
        <Button>Add Students</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle className="font-bold">Add Students to Classroom</DialogTitle>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="flex flex-col gap-y-4">
              {error && <p className="text-destructive">{error}</p>}
              <div className="text-sm text-muted-foreground">
                Current students: {currentStudentCount} / 36
              </div>
              <FormField
                control={form.control}
                name="student_count"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex gap-x-4 items-center">
                      <FormLabel>Number of Students</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          max={maxAllowed}
                          {...field}
                          value={field.value || ""}
                          onChange={(e) => {
                            const value = e.target.value;
                            const numValue = value === "" ? 0 : parseInt(value, 10);
                            if (!isNaN(numValue)) {
                              field.onChange(numValue);
                            }
                          }}
                        />
                      </FormControl>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Maximum: {maxAllowed} students
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={maxAllowed <= 0}>
                {maxAllowed <= 0 ? "Classroom Full" : "Add Students"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

