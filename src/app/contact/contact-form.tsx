"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
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
import { Textarea } from "~/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  buildContactInquirySchema,
  CONTACT_MESSAGE_MAX,
  CONTACT_TOPIC_VALUES,
  type ContactInquiryInput,
  type ContactTopic,
} from "~/lib/contact-schema";
import { cn } from "~/lib/utils";

const topicTranslationKey: Record<ContactTopic, string> = {
  purchasing: "topic_purchasing",
  how_to_use: "topic_how_to_use",
  technical: "topic_technical",
  other: "topic_other",
};

type FormValues = ContactInquiryInput;

export function ContactForm({ className }: { className?: string }) {
  const t = useTranslations("Contact");
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const schema = useMemo(
    () =>
      buildContactInquirySchema({
        required: t("error_required"),
        email: t("error_email"),
        emailMax: t("error_email_max"),
        nameMax: t("error_name_max"),
        messageMax: t("error_message_max"),
      }),
    [t]
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      topic: "purchasing",
      name: "",
      email: "",
      message: "",
    },
  });

  async function onSubmit(values: FormValues) {
    setFormError(null);
    setSuccess(false);
    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const data = (await res.json().catch(() => ({}))) as {
      error?: string;
    };

    if (!res.ok) {
      setFormError(data.error ?? t("error_generic"));
      return;
    }

    setSuccess(true);
    form.reset({
      topic: "purchasing",
      name: "",
      email: "",
      message: "",
    });
  }

  return (
    <div className={cn("space-y-4", className)}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <FormField
            control={form.control}
            name="topic"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("topic_label")}</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={t("topic_placeholder")} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {CONTACT_TOPIC_VALUES.map((value) => (
                      <SelectItem key={value} value={value}>
                        {t(topicTranslationKey[value])}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("name_label")}</FormLabel>
                <FormControl>
                  <Input autoComplete="name" {...field} />
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
                <FormLabel>{t("email_label")}</FormLabel>
                <FormControl>
                  <Input type="email" autoComplete="email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="message"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("message_label")}</FormLabel>
                <FormControl>
                  <Textarea
                    className="min-h-32 resize-y"
                    placeholder={t("message_placeholder")}
                    maxLength={CONTACT_MESSAGE_MAX}
                    {...field}
                  />
                </FormControl>
                <p className="text-muted-foreground text-xs">
                  {t("message_hint", { max: CONTACT_MESSAGE_MAX })}
                </p>
                <FormMessage />
              </FormItem>
            )}
          />

          {formError ? (
            <p className="text-destructive text-sm" role="alert">
              {formError}
            </p>
          ) : null}
          {success ? (
            <p className="text-sm font-medium text-green-700" role="status">
              {t("success")}
            </p>
          ) : null}

          <Button
            type="submit"
            className="w-full sm:w-auto"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? t("submitting") : t("submit")}
          </Button>
        </form>
      </Form>
    </div>
  );
}
