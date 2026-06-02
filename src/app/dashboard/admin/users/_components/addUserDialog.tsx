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
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { authClient } from "~/lib/auth-client";
import { Label } from "~/components/ui/label";

type Userform = {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  role: "user" | "admin";
};

export default function AddUserDialog({
  openState,
  setOpenState,
}: {
  openState: boolean;
  setOpenState: (open: boolean) => void;
}) {
  const t = useTranslations("dashboard.admin.users");
  const tc = useTranslations("dashboard.admin.common");

  const [error, setError] = React.useState<string>();
  const [loading, setLoading] = React.useState(false);

  const userSchema = React.useMemo(
    () =>
      z.object({
        first_name: z.string(),
        last_name: z.string(),
        email: z.string(),
        password: z.string(),
        role: z.enum(["user", "admin"]),
      }),
    []
  );

  const form = useForm<Userform>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      password: "",
      role: "user",
    },
  });

  async function onSubmit({
    first_name,
    last_name,
    email,
    password,
    role,
  }: Userform) {
    const { data, error } = await authClient.signUp.email(
      {
        email: email,
        password: password,
        name: `${first_name} ${last_name}`,
        role: role,
      } as Parameters<typeof authClient.signUp.email>[0] & { role: string },
      {
        onRequest: () => {
          setLoading(true);
        },
        onSuccess: () => {
          setLoading(false);
        },
        onError: async (ctx) => {
          setLoading(false);
          console.error(ctx.error);
          console.error("response", ctx.response);
          setError(ctx.error.message);
        },
      }
    );
    console.log({ data, error });
  }

  return (
    <Dialog open={openState} onOpenChange={setOpenState}>
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
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
