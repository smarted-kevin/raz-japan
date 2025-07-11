"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
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
import type { NewCourseForm} from "../../_actions/schemas";
import { useMutation } from "convex/react";
import { api } from "~/convex/_generated/api";
import { useRouter } from "next/navigation";

export default function AddCourseDialog({ 
  openState, setOpenState }: {
  openState: boolean,
  setOpenState: (open: boolean) => void
}) {
  const router = useRouter();
  const addCourse = useMutation(api.mutations.course.createCourse);

  const [error, setError] = React.useState<string>();
  const form = useForm<NewCourseForm>({
    defaultValues: {
      course_name: "",
      price: 0
    }
  });


  async function onSubmit(values: NewCourseForm) {
    const result = await addCourse({ course_name: values.course_name, price: values.price });
    if (result.error) {
      setError(result.error);
    } else {
      setError(undefined);
      setOpenState(false);
      router.refresh();
    }
  }

  return (
    <Dialog open={openState} onOpenChange={setOpenState}>
      <DialogTrigger className="w-min" asChild>
      <Button>+ Add Course</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle className="font-bold">Add New Course</DialogTitle>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="flex flex-col gap-y-4">
            {error && <p className="text-destructive">{error}</p>}
            <FormField
              control={form.control}
              name="course_name"
              render={({ field }) => (
                <FormItem>
                  <div className="flex gap-x-4 items-center">
                    <FormLabel>Course Name</FormLabel>
                    <FormControl>
                      <Input type="text" {...field} />
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
              />
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex gap-x-4 items-center">
                      <FormLabel>Price</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          max="25000"
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseInt(e.target.value))
                          } 
                        />
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit">Submit</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
