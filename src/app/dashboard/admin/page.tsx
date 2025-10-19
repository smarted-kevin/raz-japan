import { api } from "@/convex/_generated/api";
import { fetchQuery } from "convex/nextjs";
import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import { redirect } from "next/navigation";
import SignIn from "~/app/(auth)/sign-in/SignIn";
import { getToken } from "~/lib/auth-server";

export default async function Page() {

  const token = await getToken();
  if (!token) redirect("/sign-in");
  if (token) {
    const user = await fetchQuery(api.auth.getCurrentUser, {}, {token});
    if (!user || user.role != "admin") redirect("/sign-in");
  }
  
  return ( 
    <>
      
    </>
  )
}