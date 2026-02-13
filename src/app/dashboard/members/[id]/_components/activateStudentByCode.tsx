"use client";

import * as React from "react";
import { useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import { api } from "../../../../../../convex/_generated/api";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import type { Id } from "convex/_generated/dataModel";
import { KeyRound } from "lucide-react";

export default function ActivateStudentByCode({
  userId,
}: {
  userId: Id<"userTable">;
}) {
  const [activationCode, setActivationCode] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);
  const router = useRouter();

  const activateStudent = useMutation(api.mutations.student.activateStudentByActivationCode);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setIsSubmitting(true);

    try {
      const result = await activateStudent({
        activation_code: activationCode.trim(),
        user_id: userId,
      });

      if (result.success) {
        setSuccess(true);
        setActivationCode("");
        // Refresh the page to show the new student
        router.refresh();
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError(result.error ?? "Failed to activate student");
      }
    } catch (err) {
      setError("An error occurred while activating the student");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-3xl overflow-hidden">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <KeyRound className="h-5 w-5 text-primary" aria-hidden />
          </div>
          <CardTitle className="text-base sm:text-lg">Add student by activation code</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-3">
          <div className="flex flex-1 flex-col gap-2">
            <Label htmlFor="activation-code" className="sr-only sm:not-sr-only">
              Activation Code
            </Label>
            <Input
              id="activation-code"
              type="text"
              value={activationCode}
              onChange={(e) => {
                setActivationCode(e.target.value);
                setError(null);
                setSuccess(false);
              }}
              placeholder="Enter activation code"
              disabled={isSubmitting}
              required
              className="w-full"
            />
          </div>
          <Button
            className="w-full shrink-0 sm:w-auto sm:min-w-[140px]"
            type="submit"
            disabled={isSubmitting || !activationCode.trim()}
          >
            {isSubmitting ? "Activating..." : "Activate Student"}
          </Button>
        </form>
        {error && (
          <p className="mt-3 text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
        {success && (
          <p className="mt-3 text-sm text-green-600 dark:text-green-500" role="status">
            Student activated successfully!
          </p>
        )}
      </CardContent>
    </Card>
  );
}

