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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";

const editUserSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  status: z.enum(["active", "inactive"]),
});

type EditUserForm = z.infer<typeof editUserSchema>;

export function EditUserDialog({
  userId,
  initialFirstName,
  initialLastName,
  initialEmail,
  initialStatus,
}: {
  userId: Id<"userTable">;
  initialFirstName: string;
  initialLastName: string;
  initialEmail: string;
  initialStatus: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [error, setError] = React.useState<string>();
  const [loading, setLoading] = React.useState(false);
  const adminUpdateUserInfo = useAction(api.stripe.adminUpdateUserInfo);

  const form = useForm<EditUserForm>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      first_name: initialFirstName,
      last_name: initialLastName,
      email: initialEmail,
      status: (initialStatus === "active" || initialStatus === "inactive"
        ? initialStatus
        : "active"),
    },
  });

  // Reset form when dialog opens with latest values
  React.useEffect(() => {
    if (open) {
      form.reset({
        first_name: initialFirstName,
        last_name: initialLastName,
        email: initialEmail,
        status: (initialStatus === "active" || initialStatus === "inactive"
          ? initialStatus
          : "active"),
      });
    }
  }, [open, initialFirstName, initialLastName, initialEmail, initialStatus, form]);

  async function onSubmit({
    first_name,
    last_name,
    email,
    status,
  }: EditUserForm) {
    setError(undefined);
    setLoading(true);

    try {
      await adminUpdateUserInfo({
        userId,
        first_name,
        last_name,
        email,
        status,
      });
      setOpen(false);
      window.location.reload();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update user information"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Edit User
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle className="font-bold">Edit User Information</DialogTitle>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="flex flex-col gap-y-4">
              {error && (
                <p className="text-destructive text-sm">{error}</p>
              )}
              <FormField
                control={form.control}
                name="first_name"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex gap-x-4 items-center">
                      <FormLabel className="min-w-[80px]">First Name</FormLabel>
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
                      <FormLabel className="min-w-[80px]">Last Name</FormLabel>
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
                      <FormLabel className="min-w-[80px]">Email</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} />
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex gap-x-4 items-center">
                      <FormLabel className="min-w-[80px]">Status</FormLabel>
                      <FormControl>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                >
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
