import { ConvexClientProvider } from "~/app/ConvexClientProvider";
import { NextIntlClientProvider } from "next-intl";
import { getLocale } from "next-intl/server";



export default async function MemberLayout({ children }: { children: React.ReactNode } ) {
  const locale = await getLocale();

  return ( 
    <NextIntlClientProvider>
      <ConvexClientProvider>
        <div className="container mx-auto pt-4">{ children }</div>
      </ConvexClientProvider>
    </NextIntlClientProvider>
  )
}