import { type Metadata } from "next";
import { getTranslations } from "next-intl/server";
import SignUp from "./SignUp";
import { PublicAuthPageShell } from "~/components/layout/public-auth-page-shell";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Auth");
  return {
    title: t("sign_up_meta_title"),
  };
}

export default async function SignUpPage() {
  const t = await getTranslations("Auth");

  return (
    <PublicAuthPageShell
      title={t("sign_up_title")}
      subtitle={t("sign_up_subtitle")}
      backLabel={t("back_to_home")}
    >
      <SignUp />
    </PublicAuthPageShell>
  );
}
