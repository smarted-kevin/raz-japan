"use client";

import { useState } from "react";
import Link from "next/link";
import { authClient } from "~/lib/auth-client";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";

export default function ResetPassword({
  token,
  invalid,
}: {
  token?: string;
  invalid: boolean;
}) {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [complete, setComplete] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!token) return;
    if (password.length < 12) {
      setError("Password must be at least 12 characters.");
      return;
    }
    if (password !== confirmation) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    const result = await authClient.resetPassword({ newPassword: password, token });
    setLoading(false);

    if (result.error) {
      setError("This reset link is invalid or has expired.");
      return;
    }
    setComplete(true);
  }

  return (
    <Card className="w-full max-w-md border-2 border-gray-100 bg-white shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg">New password</CardTitle>
      </CardHeader>
      <CardContent>
        {invalid ? (
          <p className="text-sm text-red-700" role="alert">
            This reset link is invalid or has expired. Request a new link from the{" "}
            <Link href="/forgot-password" className="underline">forgot-password page</Link>.
          </p>
        ) : complete ? (
          <p className="text-sm" role="status">
            Your password has been changed and other sessions were revoked. You can now{" "}
            <Link href="/sign-in" className="text-blue-700 underline">sign in</Link>.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="new-password">New password</Label>
              <Input
                id="new-password"
                type="password"
                autoComplete="new-password"
                minLength={12}
                maxLength={128}
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="confirm-password">Confirm password</Label>
              <Input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                minLength={12}
                maxLength={128}
                required
                value={confirmation}
                onChange={(event) => setConfirmation(event.target.value)}
              />
            </div>
            {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
            <Button type="submit" disabled={loading}>
              {loading ? "Updating…" : "Update password"}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
