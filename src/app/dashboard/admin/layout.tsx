import TopNav from "./_components/navBar";
import { Geist } from "next/font/google";
import { getLocale } from "next-intl/server";

export default async function AdminLayout({ 
  children 
}: Readonly<{ children: React.ReactNode }> 
) {

  return (
      <>
        <TopNav></TopNav>
        <div className="container mx-auto pt-4">{ children }</div>
      </>

  )
}