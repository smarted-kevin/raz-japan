"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useState } from "react";
import { useForm} from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import type { signInSchema } from "~/auth/schemas";
import Link from "next/link";
import { useTranslations } from "next-intl";
 
export function SignIn() {
  const t = useTranslations("General");

  const { signIn } = useAuthActions();
  const [step, setStep] = useState<"signUp" | "signIn">("signIn");
  //const [error, setError] = useState<string>();

  const form = useForm<signInSchema>({
    defaultValues: { 
      email: "",
      password: "",
    }
  });
  
  return (
    <Form {...form}>
      <form 
         onSubmit={(event) => {
          event.preventDefault();
          const formData = new FormData(event.currentTarget);
          formData.set("flow", "signIn");
          void signIn("password-custom", formData);
        }}
        className="space-y-8"
      >
        
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("email")}</FormLabel>
              <FormControl>
                <Input type="email" {...field} />
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
        <div className="flex gap-4 justify-end">
          <Button asChild variant="link">
            <Link href="/sign-up">Sign Up</Link>
          </Button>
          <Button type="submit">Sign In</Button>
        </div>
      </form>
    </Form>
  );
}