"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
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
import type { 
  NewClassroomForm, 
  Course, 
  Organization } 
from "../../_actions/schemas";
import { addClassroom } from "../../_actions/classroom";
import { useRouter } from "next/navigation";


export default function AddClassroomDialog({
  courses, orgs, openState, setOpenState
}: {
  courses: Course[],
  orgs: Organization[],
  openState: boolean,
  setOpenState: (open: boolean) => void
}) {

  const router = useRouter();
  const [error, setError] = React.useState<string>();
  const form = useForm<NewClassroomForm>({
    defaultValues: {
      classroom_name: "",
      course_name: courses[0]?.course_name,
      organization_name: orgs[0]?.organization_name,
      student_count: 36
    }
  });

  async function onSubmit(values: NewClassroomForm) {
    const result = await addClassroom(values);
    if (typeof result === "string") {
      setError(result);
    } else {
      // Success case - clear error and close dialog
      setError(undefined);
      setOpenState(false);
      router.refresh();
    }
  }

  return (
    <Dialog open={openState} onOpenChange={setOpenState}>
      <DialogTrigger className="w-min" asChild>
        <Button>+ Add Classroom</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle className="font-bold">Add New Classroom</DialogTitle>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="flex flex-col gap-y-4">
              {error && <p className="text-destructive">{error}</p>}
              <FormField
                control={form.control}
                name="classroom_name"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex gap-x-4 items-center">
                      <FormLabel>Classroom Name</FormLabel>
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
                name="course_name"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex gap-x-4 items-center">
                      <FormLabel>Course</FormLabel>
                      <FormControl>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {courses.map((c) => (
                              <SelectItem key={c._id} value={c.course_name}>
                                {c.course_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="organization_name"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex gap-x-4 items-center">
                      <FormLabel>Organization</FormLabel>
                      <FormControl>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {orgs.map((org) => (
                              <SelectItem
                                key={org.organization_name}
                                value={org.organization_name}
                              >
                                {org.organization_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="student_count"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex gap-x-4 items-center">
                      <FormLabel># of Students</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          max="36"
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