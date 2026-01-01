"use client";

import * as React from "react";
import { useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import { api } from "../../../../../../convex/_generated/api";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import type { Id } from "convex/_generated/dataModel";

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
    <div className="flex flex-col gap-y-4 mx-12 my-6 p-6 border-2 rounded-lg w-2/3">
      <h2 className="font-bold text-lg">Add student by activation code</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-y-4">
        <div className="flex flex-col gap-y-2">
          <Label htmlFor="activation-code">Activation Code</Label>
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
          />
        </div>
        {error && (
          <div className="text-red-600 text-sm">{error}</div>
        )}
        {success && (
          <div className="text-green-600 text-sm">
            Student activated successfully!
          </div>
        )}
        <Button className="w-1/4 mx-auto" type="submit" disabled={isSubmitting || !activationCode.trim()}>
          {isSubmitting ? "Activating..." : "Activate Student"}
        </Button>
      </form>
    </div>
  );
}

