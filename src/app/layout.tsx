import "~/styles/globals.css";
import { ConvexClientProvider } from "~/app/ConvexClientProvider";
import { type Metadata } from "next";
import { headers } from "next/headers";
import { NextIntlClientProvider } from "next-intl";
import { getLocale } from "next-intl/server";
import { getServerSession } from "~/lib/get-session";
import type { User } from "convex/auth";
import { redirect } from "next/navigation";

const PUBLIC_PATHS = [
  "/scta",
  "/getting-started",
  "/contact",
  "/sign-in",
  "/sign-up",
];

export const metadata: Metadata = {
  title: "Raz Japan",
  description: "Raz but in Japan",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {

  const headersList = await headers();
  const pathname = headersList.get("x-pathname") ?? "";

  const isPublicPath = PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );

  if (!isPublicPath) {
    const session = await getServerSession();
    const user = session?.user as User;

    if (user && user.role == "user") {
      redirect(`/dashboard/member/${user.id}`);
    }

    if (user && (user.role == "admin" || user.role == "god")) {
      redirect("/dashboard/admin");
    }
  }

  const locale = await getLocale();

  return (
    <html lang={locale}>
        <body>
          <NextIntlClientProvider>
            <ConvexClientProvider>
              {children}
            </ConvexClientProvider>
          </NextIntlClientProvider>
        </body>
      </html>
  )
}
      
