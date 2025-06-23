import { ConvexClientProvider } from "~/app/ConvexClientProvider";
import { Geist } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale } from "next-intl/server";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export default async function AdminLayout({ children }: { children: React.ReactNode } ) {
  const locale = await getLocale();

  return ( 
    <html lang={locale} className={`${geist.variable}`}>
      <body>
        <NextIntlClientProvider>
          <ConvexClientProvider>
            <div className="container mx-auto pt-4">{ children }</div>
          </ConvexClientProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}