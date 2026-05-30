"use client";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useConvex } from "convex/react";
import { api } from "convex/_generated/api";
import { authClient } from "~/lib/auth-client";
import { publicCtaYellowButtonClassName } from "~/lib/public-cta-styles";
import { cn } from "~/lib/utils";

export default function SignUp() {
  const router = useRouter();
  const convex = useConvex();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");

  const [loading, setLoading] = useState(false);

  
  const handleSignUp = async () => {
    if (password !== passwordConfirmation) {
      toast.error("Passwords do not match.");
      return;
    }

    await authClient.signUp.email(
      {
        email,
        password,
        name: `${firstName} ${lastName}`,
      },
      {
        onRequest: () => {
          setLoading(true);
        },
        onSuccess: async (ctx) => {
          toast.success("Thank you for creating your account!");
          try {
            const authId = ctx.data?.user?.id as string | undefined;
            if (authId) {
              const { user_id } = await convex.query(
                api.queries.users.getUserRoleByAuthId,
                { userId: authId },
              );
              router.push(`/dashboard/members/${user_id}`);
              return;
            }
          } catch (err) {
            console.error("Failed to resolve member id after sign-up", err);
          }
          router.push("/dashboard/");
        },
        onError: (ctx) => {
          setLoading(false);
          console.error(ctx.error);
          console.error("response", ctx.response);
          toast.error(ctx.error.message);
        },
      },
    );
  };

  return (
    <Card className="w-full max-w-md border-2 border-gray-100 bg-white shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg text-gray-900 md:text-xl">Sign Up</CardTitle>
        <CardDescription className="text-xs text-gray-600 md:text-sm">
          Enter your information to create an account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="first-name" className="text-gray-700">First name</Label>
              <Input
                id="first-name"
                placeholder="Max"
                required
                onChange={(e) => {
                  setFirstName(e.target.value);
                }}
                value={firstName}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="last-name" className="text-gray-700">Last name</Label>
              <Input
                id="last-name"
                placeholder="Robinson"
                required
                onChange={(e) => {
                  setLastName(e.target.value);
                }}
                value={lastName}
              />
            </div>
          </div>
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
            <Label htmlFor="password" className="text-gray-700">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              placeholder="Password"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password_confirmation" className="text-gray-700">
              Confirm Password
            </Label>
            <Input
              id="password_confirmation"
              type="password"
              value={passwordConfirmation}
              onChange={(e) => setPasswordConfirmation(e.target.value)}
              autoComplete="new-password"
              placeholder="Confirm Password"
            />
          </div>
          <Button
            type="submit"
            className={cn("w-full", publicCtaYellowButtonClassName)}
            disabled={loading}
            onClick={handleSignUp}
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              "Create an account"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
