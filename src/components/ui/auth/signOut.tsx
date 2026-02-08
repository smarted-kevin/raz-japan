"use client"

import { Button } from "~/components/ui/button"
import { useTranslations } from "next-intl";
import { authClient } from "~/lib/auth-client";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { cn } from "~/lib/utils";

interface SignOutButtonProps {
  collapsed?: boolean;
}

export function SignOutButton({ collapsed = false }: SignOutButtonProps) {
  const t = useTranslations("General");
  const router = useRouter();

  if (collapsed) {
    return (
      <Button 
        variant="ghost"
        size="icon"
        className="text-white hover:bg-white/20 hover:text-white flex-shrink-0"
        onClick={ async () => 
          await authClient.signOut({
            fetchOptions: {
              onSuccess: () => {
                router.push("/sign-in");
              }
            }
          })
        }
        aria-label={t("logout_button")}
        title={t("logout_button")}
      >
        <LogOut className="h-5 w-5 flex-shrink-0" />
      </Button>
    );
  }

  return (
    <Button 
      variant="destructive" 
      className="flex-shrink-0"
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