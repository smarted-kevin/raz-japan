"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import { api } from "../../../../../convex/_generated/api";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import type { Id } from "convex/_generated/dataModel";

export function ExtendStudentByCode({
  studentId,
  studentUsername,
}: {
  studentId: Id<"student">;
  studentUsername: string;
}) {
  const t = useTranslations("dashboard.members");
  const [activationCode, setActivationCode] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const router = useRouter();

  const renewStudent = useMutation(api.mutations.student.renewStudentByActivationCode);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setIsSubmitting(true);

    try {
      const result = await renewStudent({
        activation_code: activationCode.trim(),
        student_id: studentId,
      });

      if (result.success) {
        setSuccess(true);
        setActivationCode("");
        // Refresh the page to show the updated student
        router.refresh();
        // Close dialog and clear success message after 2 seconds
        setTimeout(() => {
          setSuccess(false);
          setOpen(false);
        }, 2000);
      } else {
        setError(result.error ?? "Failed to extend student");
      }
    } catch (err) {
      setError("An error occurred while extending the student");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      // Reset state when dialog closes
      setActivationCode("");
      setError(null);
      setSuccess(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="text-xs">
          {t("extend_with_code")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("extend_subscription_title")}</DialogTitle>
          <DialogDescription>
            {t("extend_subscription_desc", { username: studentUsername })}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-y-4 mt-4">
          <div className="flex flex-col gap-y-2">
            <Label htmlFor="extend-activation-code">{t("activation_code")}</Label>
            <Input
              id="extend-activation-code"
              type="text"
              value={activationCode}
              onChange={(e) => {
                setActivationCode(e.target.value);
                setError(null);
                setSuccess(false);
              }}
              placeholder={t("enter_activation_code")}
              disabled={isSubmitting}
              required
            />
          </div>
          {error && (
            <div className="text-red-600 text-sm">{error}</div>
          )}
          {success && (
            <div className="text-green-600 text-sm">
              {t("student_extended_success")}
            </div>
          )}
          <Button type="submit" disabled={isSubmitting || !activationCode.trim()}>
            {isSubmitting ? t("extending") : t("extend_subscription")}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

