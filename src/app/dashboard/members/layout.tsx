import { ConvexClientProvider } from "~/app/ConvexClientProvider";
import { NextIntlClientProvider } from "next-intl";
import { getLocale } from "next-intl/server";
import { PublicNavBar } from "~/components/ui/nav/publicNavBar";
import { redirect } from "next/navigation";
import { getToken } from "~/lib/auth-server";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";

export default async function MemberLayout({ children }: { children: React.ReactNode } ) {
  const token = await getToken();
  if (!token) redirect("/sign-in");

  const user = await fetchQuery(api.auth.getCurrentUser, {}, { token });
  if (!user) redirect("/sign-in");

  // Only allow users with "user" role to access member routes
  if (user.role !== "user") {
    redirect("/dashboard/admin");
  }

  const locale = await getLocale();

  return ( 
    <NextIntlClientProvider>
      <ConvexClientProvider>
        <PublicNavBar/>
        <div className="container mx-auto min-w-0 px-4 pt-6 pb-8 sm:px-6">
      {children}
    </div>
      </ConvexClientProvider>
    </NextIntlClientProvider>
  )
}