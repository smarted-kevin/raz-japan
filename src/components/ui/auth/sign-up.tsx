"use client"

import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "~/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { signUp } from "~/auth/actions";
import type { signUpSchema } from "~/auth/schemas";
import { useTranslations } from "next-intl";

export function SignUpForm() {

  const t = useTranslations("General");
  
  const [error, setError] = useState<string>();
  const form = useForm<signUpSchema>({
    defaultValues: {
      first_name: "",
      last_name: "", 
      email: "",
      password: "",
    }
  })

  async function onSubmit(values: signUpSchema) {
    const error = await signUp(values);
    setError(error);
    
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 m-10">
        {error && <p className="text-destructive">{error}</p>}
        <FormField
          control={form.control}
          name="first_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("first_name")}</FormLabel>
              <FormControl>
                <Input type="text" placeholder="First Name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="last_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("last_name")}</FormLabel>
              <FormControl>
                <Input type="text" placeholder="Last name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("email")}</FormLabel>
              <FormControl>
                <Input type="email" placeholder="Email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
         <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("password")}</FormLabel>
              <FormControl>
                <Input type="password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Submit</Button>
      </form>
    </Form>
  )

}