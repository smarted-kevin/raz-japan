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
import type { Course } from "../../_actions/schemas";
import { addActivationCodes, type NewActivationCodeForm } from "../../_actions/activation_code";
import { useRouter } from "next/navigation";
import type { Id } from "convex/_generated/dataModel";

type OrganizationWithId = {
  _id: Id<"organization">;
  organization_name: string;
  status: "active" | "inactive";
};

export default function AddActivationCodeDialog({
  courses,
  orgs,
  openState,
  setOpenState,
}: {
  courses: Course[];
  orgs: OrganizationWithId[];
  openState: boolean;
  setOpenState: (open: boolean) => void;
}) {
  const router = useRouter();
  const [error, setError] = React.useState<string>();
  const form = useForm<NewActivationCodeForm>({
    defaultValues: {
      quantity: 1,
      course_id: courses[0]?._id,
      organization_id: orgs[0]?._id,
    },
  });

  async function onSubmit(values: NewActivationCodeForm) {
    if (!values.course_id || !values.organization_id) {
      setError("Please select both course and organization");
      return;
    }

    const result = await addActivationCodes(values);
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
        <Button>+ Add Activation Codes</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle className="font-bold">Add New Activation Codes</DialogTitle>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="flex flex-col gap-y-4">
              {error && <p className="text-destructive">{error}</p>}
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex gap-x-4 items-center">
                      <FormLabel>Quantity</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseInt(e.target.value) || 1)
                          }
                        />
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="course_id"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex gap-x-4 items-center">
                      <FormLabel>Course</FormLabel>
                      <FormControl>
                        <Select
                          value={field.value}
                          onValueChange={(value) =>
                            field.onChange(value as Id<"course">)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {courses.map((c) => (
                              <SelectItem key={c._id} value={c._id}>
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
                name="organization_id"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex gap-x-4 items-center">
                      <FormLabel>Organization</FormLabel>
                      <FormControl>
                        <Select
                          value={field.value}
                          onValueChange={(value) =>
                            field.onChange(value as Id<"organization">)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {orgs.map((org) => (
                              <SelectItem key={org._id} value={org._id}>
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
              <Button type="submit">Submit</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

