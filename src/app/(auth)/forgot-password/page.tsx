import { type Metadata } from "next";
import { PublicAuthPageShell } from "~/components/layout/public-auth-page-shell";
import ForgotPassword from "./ForgotPassword";

export const metadata: Metadata = {
  title: "Forgot password | Raz-Japan",
};

export default function ForgotPasswordPage() {
  return (
    <PublicAuthPageShell
      title="Reset your password"
      subtitle="We’ll send a secure reset link if an account exists for that email."
      backLabel="Back to sign in"
      backHref="/sign-in"
    >
      <ForgotPassword />
    </PublicAuthPageShell>
  );
}
