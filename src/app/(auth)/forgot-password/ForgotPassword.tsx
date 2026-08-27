"use client";

import { useState } from "react";
import Link from "next/link";
import { authClient } from "~/lib/auth-client";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);

    await authClient.requestPasswordReset({
      email,
      redirectTo: `${window.location.origin}/reset-password`,
    });

    // Keep the response identical whether or not the email exists.
    setSubmitted(true);
    setLoading(false);
  }

  return (
    <Card className="w-full max-w-md border-2 border-gray-100 bg-white shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg">Password reset</CardTitle>
      </CardHeader>
      <CardContent>
        {submitted ? (
          <div className="space-y-4 text-sm">
            <p role="status">
              If an account exists for that address, a reset link has been sent.
            </p>
            <Link href="/sign-in" className="text-blue-700 hover:underline">
              Return to sign in
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="reset-email">Email</Label>
              <Input
                id="reset-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? "Sending…" : "Send reset link"}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
