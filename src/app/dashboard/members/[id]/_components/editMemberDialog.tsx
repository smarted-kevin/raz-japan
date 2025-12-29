"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useForm } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
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
import { useAction } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";

const memberInfoSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
});

type MemberInfoForm = z.infer<typeof memberInfoSchema>;

export default function EditMemberDialog({
  userId,
  initialFirstName,
  initialLastName,
  initialEmail,
  openState,
  setOpenState,
}: {
  userId: Id<"userTable">;
  initialFirstName: string;
  initialLastName: string;
  initialEmail: string;
  openState: boolean;
  setOpenState: (open: boolean) => void;
}) {
  const updateMemberInfo = useAction(api.stripe.updateMemberInfo);
  const [error, setError] = React.useState<string>();
  const [loading, setLoading] = React.useState(false);

  const form = useForm<MemberInfoForm>({
    resolver: zodResolver(memberInfoSchema),
    defaultValues: {
      first_name: initialFirstName,
      last_name: initialLastName,
      email: initialEmail,
    },
  });

  async function onSubmit({ first_name, last_name, email }: MemberInfoForm) {
    setError(undefined);
    setLoading(true);

    try {
      await updateMemberInfo({
        userId,
        first_name,
        last_name,
        email,
      });
      setOpenState(false);
      // Reload the page to show updated information
      window.location.reload();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update member information"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={openState} onOpenChange={setOpenState}>
      <DialogTrigger className="w-min" asChild>
        <Button variant="outline">Edit</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle className="font-bold">Edit Member Information</DialogTitle>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="flex flex-col gap-y-4">
              {error && <p className="text-destructive">{error}</p>}
              <FormField
                control={form.control}
                name="first_name"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex gap-x-4 items-center">
                      <FormLabel>First Name</FormLabel>
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
                name="last_name"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex gap-x-4 items-center">
                      <FormLabel>Last Name</FormLabel>
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
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex gap-x-4 items-center">
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} />
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpenState(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Saving..." : "Save Changes"}
                </Button>
              </DialogFooter>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

