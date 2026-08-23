"use client";

import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { useState } from "react";
import { authClient } from "~/lib/auth-client";
import { publicCtaBlueGradientButtonClassName } from "~/lib/public-cta-styles";
import { cn } from "~/lib/utils";
import { useRouter } from "next/navigation";


export default function SignIn() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async () => {
    await authClient.signIn.email(
      {
        email,
        password,
      },
      {
        onRequest: () => {
          setOtpLoading(true);
          setError(null);
        },
        onSuccess: () => {
          router.push("/dashboard/");
        },
        onError: () => {
          setOtpLoading(false);
          setError("Incorrect username or password");
        },
      },
    );
  };

  return (
    <Card className="w-full max-w-md border-2 border-gray-100 bg-white shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg text-gray-900 md:text-xl">Sign In</CardTitle>
        <CardDescription className="text-xs text-gray-600 md:text-sm">
          Enter your email below to login to your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <p role="alert" className="mb-4 text-sm text-red-600">
            {error}
          </p>
        )}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void handleSignIn();
          }}
          className="grid gap-4"
        >
          <div className="grid gap-2">
            <Label htmlFor="email" className="text-gray-700">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="m@example.com"
              required
              onChange={(e) => {
                setEmail(e.target.value);
              }}
              value={email}
            />
          </div>
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-gray-700">Password</Label>
            </div>
            <Input
              id="password"
              type="password"
              placeholder="password"
              autoComplete="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
            <Button
              type="submit"
              className={cn("w-full", publicCtaBlueGradientButtonClassName)}
              disabled={otpLoading}
            >
              Sign in
            </Button>
        </form>
      </CardContent>
    </Card>
  );

}
