import { ConvexClientProvider } from "~/app/ConvexClientProvider";
import { NextIntlClientProvider } from "next-intl";
import { getLocale } from "next-intl/server";
import { PublicNavBar } from "~/components/ui/nav/publicNavBar";



export default async function MemberLayout({ children }: { children: React.ReactNode } ) {
  const locale = await getLocale();

  return ( 
    <NextIntlClientProvider>
      <ConvexClientProvider>
        <PublicNavBar/>
        <div className="container mx-auto pt-4">{ children }</div>
      </ConvexClientProvider>
    </NextIntlClientProvider>
  )
}