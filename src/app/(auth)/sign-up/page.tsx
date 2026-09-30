import { type Metadata } from "next";
import { getTranslations } from "next-intl/server";
import SignUp from "./SignUp";
import { PublicAuthPageShell } from "~/components/layout/public-auth-page-shell";
import Link from "next/link";
import { Clock3 } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { isMemberSignupEnabled } from "~/lib/member-signup";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Auth");
  const memberSignupEnabled = isMemberSignupEnabled();

  return {
    title: t(
      memberSignupEnabled ? "sign_up_meta_title" : "sign_up_closed_meta_title",
    ),
  };
}

export default async function SignUpPage() {
  const t = await getTranslations("Auth");
  const memberSignupEnabled = isMemberSignupEnabled();

  return (
    <PublicAuthPageShell
      title={t(memberSignupEnabled ? "sign_up_title" : "sign_up_closed_title")}
      subtitle={t(
        memberSignupEnabled ? "sign_up_subtitle" : "sign_up_closed_subtitle",
      )}
      backLabel={t("back_to_home")}
    >
      {memberSignupEnabled ? (
        <SignUp />
      ) : (
        <Card className="w-full max-w-lg border-2 border-[#f1bddc] bg-white text-center shadow-sm">
          <CardHeader className="items-center">
            <div className="mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-[#fbe8f4] text-[#c83192]">
              <Clock3 className="h-7 w-7" aria-hidden />
            </div>
            <CardTitle className="text-xl text-gray-900 md:text-2xl">
              {t("sign_up_closed_card_title")}
            </CardTitle>
            <CardDescription className="max-w-md text-sm leading-relaxed text-gray-600 md:text-base">
              {t("sign_up_closed_card_description")}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col justify-center gap-3 sm:flex-row">
            <Button asChild>
              <Link href="/contact">{t("sign_up_closed_contact")}</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/sign-in">{t("sign_up_closed_sign_in")}</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </PublicAuthPageShell>
  );
}
