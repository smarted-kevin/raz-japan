"use client"

import { Button } from "~/components/ui/button"
import { signOut } from "~/auth/actions"
import { useTranslations } from "next-intl";

export function SignOutButton() {
  const t = useTranslations("General");

  return (
    <Button variant="destructive" onClick={async () => await signOut()}>
      { t("logout_button") }
    </Button>
  )
}