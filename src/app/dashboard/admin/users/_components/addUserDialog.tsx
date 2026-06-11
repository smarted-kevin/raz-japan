"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
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
import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { authClient } from "~/lib/auth-client";
import { Label } from "~/components/ui/label";
import type { Doc, Id } from "convex/_generated/dataModel";
import { assignOrgAdminOrganizationForCreatedUser } from "../../_actions/users";

type UserRole = "user" | "admin" | "org_admin";

type Userform = {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  role: UserRole;
  org_id?: Id<"organization">;
};

export default function AddUserDialog({
  orgs,
  openState,
  setOpenState,
}: {
  orgs: Doc<"organization">[];
  openState: boolean;
  setOpenState: (open: boolean) => void;
}) {
  const router = useRouter();
  const t = useTranslations("dashboard.admin.users");
  const tc = useTranslations("dashboard.admin.common");

  const [error, setError] = React.useState<string>();
  const [loading, setLoading] = React.useState(false);

  const userSchema = React.useMemo(
    () =>
      z
        .object({
          first_name: z.string(),
          last_name: z.string(),
          email: z.string(),
          password: z.string(),
          role: z.enum(["user", "admin", "org_admin"]),
          org_id: z.custom<Id<"organization">>().optional(),
        })
        .refine((values) => values.role !== "org_admin" || !!values.org_id, {
          message: tc("organization_required"),
          path: ["org_id"],
        }),
    [tc]
  );

  const form = useForm<Userform>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      password: "",
      role: "user",
      org_id: undefined,
    },
  });

  const selectedRole = form.watch("role");

  React.useEffect(() => {
    if (selectedRole !== "org_admin") {
      form.setValue("org_id", undefined);
    }
  }, [form, selectedRole]);

  const handleOpenChange = React.useCallback(
    (open: boolean) => {
      if (!open) {
        setError(undefined);
        form.reset();
      }
      setOpenState(open);
    },
    [form, setOpenState]
  );

  async function onSubmit({
    first_name,
    last_name,
    email,
    password,
    role,
    org_id,
  }: Userform) {
    setLoading(true);
    setError(undefined);

    try {
      const { data, error } = await authClient.admin.createUser({
        email: email,
        password: password,
        name: `${first_name} ${last_name}`,
        role: role,
      } as Parameters<typeof authClient.admin.createUser>[0]);

      if (error) {
        setError(error.message ?? tc("error_generic"));
        return;
      }

      if (role === "org_admin") {
        if (!org_id) {
          setError(tc("organization_required"));
          return;
        }

        const result = await assignOrgAdminOrganizationForCreatedUser({
          email: data?.user?.email ?? email,
          org_id,
        });

        if (!result.success) {
          setError(result.error);
          return;
        }
      }

      form.reset();
      setOpenState(false);
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : tc("error_generic"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={openState} onOpenChange={handleOpenChange}>
      <DialogTrigger className="w-min" asChild>
        <Button>{t("add_user")}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle className="font-bold">{t("add_new_user")}</DialogTitle>
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
                      <FormLabel>{tc("first_name")}</FormLabel>
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
                      <FormLabel>{tc("last_name")}</FormLabel>
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
                      <FormLabel>{tc("email")}</FormLabel>
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
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex gap-x-4 items-center">
                      <FormLabel>{tc("password")}</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} />
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>{tc("select_option")}</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-col space-y-1"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="user" id="user" />
                          <Label htmlFor="user">{tc("role_user")}</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="admin" id="admin" />
                          <Label htmlFor="admin">{tc("role_admin")}</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="org_admin" id="org_admin" />
                          <Label htmlFor="org_admin">{tc("role_org_admin")}</Label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {selectedRole === "org_admin" && (
                <FormField
                  control={form.control}
                  name="org_id"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex gap-x-4 items-center">
                        <FormLabel>{tc("organization")}</FormLabel>
                        <FormControl>
                          <Select
                            value={field.value}
                            onValueChange={(value) =>
                              field.onChange(value as Id<"organization">)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder={tc("select_option")} />
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
              )}
              <Button type="submit" disabled={loading}>
                {tc("submit")}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
