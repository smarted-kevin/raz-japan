import "~/styles/globals.css";

import { type Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";


export const metadata: Metadata = {
  title: "Raz Japan",
  description: "Raz but in Japan",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {

  return (
    <NextIntlClientProvider>
      { children }
    </NextIntlClientProvider>
  );
}
