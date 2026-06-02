"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl";
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

type EditUserForm = {
  first_name: string;
  last_name: string;
  email: string;
  status: "active" | "inactive";
};

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
  const t = useTranslations("dashboard.admin.users");
  const tc = useTranslations("dashboard.admin.common");

  const editUserSchema = React.useMemo(
    () =>
      z.object({
        first_name: z.string().min(1, tc("error_first_name_required")),
        last_name: z.string().min(1, tc("error_last_name_required")),
        email: z.string().email(tc("error_invalid_email")),
        status: z.enum(["active", "inactive"]),
      }),
    [tc]
  );

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
      status:
        initialStatus === "active" || initialStatus === "inactive"
          ? initialStatus
          : "active",
    },
  });

  React.useEffect(() => {
    if (open) {
      form.reset({
        first_name: initialFirstName,
        last_name: initialLastName,
        email: initialEmail,
        status:
          initialStatus === "active" || initialStatus === "inactive"
            ? initialStatus
            : "active",
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
        err instanceof Error ? err.message : tc("error_update_failed")
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          {t("edit_user")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle className="font-bold">{t("edit_user_information")}</DialogTitle>
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
                      <FormLabel className="min-w-[80px]">{tc("first_name")}</FormLabel>
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
                      <FormLabel className="min-w-[80px]">{tc("last_name")}</FormLabel>
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
                      <FormLabel className="min-w-[80px]">{tc("email")}</FormLabel>
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
                      <FormLabel className="min-w-[80px]">{tc("status")}</FormLabel>
                      <FormControl>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">{tc("active")}</SelectItem>
                            <SelectItem value="inactive">{tc("inactive")}</SelectItem>
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
                  {tc("cancel")}
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? tc("saving") : tc("save_changes")}
                </Button>
              </DialogFooter>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
