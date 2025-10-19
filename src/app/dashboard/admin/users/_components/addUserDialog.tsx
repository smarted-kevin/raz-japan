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
import { useMutation } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";

const userSchema = z.object({
  first_name: z.string(),
  last_name: z.string(), 
  email: z.string(),
  password: z.string(),
  role: z.enum(["user", "admin"])
})

type Userform = z.infer<typeof userSchema>;

export default function AddUserDialog({
  openState, setOpenState }: {
  openState: boolean,
  setOpenState: (open: boolean) => void
}) {

  const createUser = useMutation(api.mutations.users.createUser);

  const [error, setError] = React.useState<string>();
  const [loading, setLoading] = React.useState(false);
  
  const form = useForm<Userform>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      password: "",
      role: "user"
    },
  });

  async function onSubmit({first_name, last_name, email, password, role}: Userform) {
    const { data, error } = await authClient.signUp.email(
      {
        email: email,
        password: password,
        name: `${first_name} ${last_name}`,
        role: role
      } as Parameters<typeof authClient.signUp.email>[0] & { role: string },
      {
        onRequest: () => {
          setLoading(true);
        },
        onSuccess: async () => {
          setLoading(false);
          // try {
          //   await createUser(
          //     {
          //       first_name,
          //       last_name,
          //       email,
          //       role,
          //       updated_at: Date.now(),
          //       status: "active"
          //     }
          //   )
          // } catch (e) {
          //   console.log(e);
          // }
        },
        onError: async (ctx) => {
          setLoading(false);
          console.error(ctx.error);
          console.error("response", ctx.response);
          setError(ctx.error.message);
          //toast.error(ctx.error.message);
        },
      },
    );
    console.log({ data, error });
  }


  return (
    <Dialog open={openState} onOpenChange={setOpenState}>
      <DialogTrigger className="w-min" asChild>
      <Button>+ Add User</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle className="font-bold">Add New User</DialogTitle>
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
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex gap-x-4 items-center">
                      <FormLabel>Password</FormLabel>
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
                    <FormLabel>Select an option</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-col space-y-1"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="user" id="user" />
                          <Label htmlFor="user">User</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="admin" id="admin" />
                          <Label htmlFor="admin">Admin</Label>
                        </div>
                      </RadioGroup>
                    </FormControl>
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