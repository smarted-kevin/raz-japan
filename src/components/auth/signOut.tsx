"use client"

import { Button } from "~/components/ui/button"
import { useTranslations } from "next-intl";
import { authClient } from "~/lib/auth-client";
import { useRouter } from "next/navigation";

export function SignOutButton() {
  const t = useTranslations("General");
  const router = useRouter();

  return (
    <Button 
      variant="destructive" 
      onClick={ async () => 
        await authClient.signOut({
          fetchOptions: {
            onSuccess: () => {
              router.push("/sign-in");
            }
          }
        })
      }>
      { t("logout_button") }
    </Button>
  )
}