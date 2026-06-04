import { type Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { fetchQuery } from "convex/nextjs";
import SignIn from "./SignIn";
import { getToken } from "~/lib/auth-server";
import { PublicAuthPageShell } from "~/components/layout/public-auth-page-shell";
import { api } from "@/convex/_generated/api";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Auth");
  return {
    title: t("sign_in_meta_title"),
  };
}

export default async function SignInPage() {
  const t = await getTranslations("Auth");

  const token = await getToken();
  if (token) {
    const user = await fetchQuery(api.auth.getCurrentUser, {}, { token });

    console.log({
      ...user,
      createdAt: new Date(user.createdAt),
    });

    if (token && user.role == "admin") {
      redirect("/dashboard");
    }
    if (user && user.role == "user") {
      const userTableUser = await fetchQuery(
        api.queries.users.getUserRoleByAuthId,
        { userId: user._id },
      );
      if (userTableUser) {
        redirect(`/dashboard/members/${userTableUser.user_id}`);
      }
    }
  }

  return (
    <PublicAuthPageShell
      title={t("sign_in_title")}
      subtitle={t("sign_in_subtitle")}
      backLabel={t("back_to_home")}
    >
      <SignIn />
    </PublicAuthPageShell>
  );
}
