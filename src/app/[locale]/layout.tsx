import { ConvexAuthNextjsServerProvider } from "@convex-dev/auth/nextjs/server";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "~/i18n/routing.public";
import { ConvexClientProvider } from "../ConvexClientProvider";

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  // Ensure that the incoming `locale` is valid
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  return (
    <ConvexAuthNextjsServerProvider>
      <html lang={locale}>
        <body>
          <NextIntlClientProvider>
            <ConvexClientProvider>{children}</ConvexClientProvider>
          </NextIntlClientProvider>
        </body>
      </html>

    </ConvexAuthNextjsServerProvider>
  )
}