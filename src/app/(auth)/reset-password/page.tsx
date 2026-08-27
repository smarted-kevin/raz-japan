import { type Metadata } from "next";
import { PublicAuthPageShell } from "~/components/layout/public-auth-page-shell";
import ResetPassword from "./ResetPassword";

export const metadata: Metadata = {
  title: "Reset password | Raz-Japan",
};

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; error?: string }>;
}) {
  const { token, error } = await searchParams;

  return (
    <PublicAuthPageShell
      title="Choose a new password"
      subtitle="Reset links expire after 30 minutes and can only be used once."
      backLabel="Back to sign in"
      backHref="/sign-in"
    >
      <ResetPassword token={token} invalid={Boolean(error) || !token} />
    </PublicAuthPageShell>
  );
}
