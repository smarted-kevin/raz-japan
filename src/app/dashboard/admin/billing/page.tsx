import { fetchQuery } from "convex/nextjs";
import { redirect } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { getToken } from "~/lib/auth-server";
export default async function BillingPage() {
  const token = await getToken();
  const user = await fetchQuery(api.auth.getCurrentUser, {}, { token });
  if (!user || !["admin", "god"].includes(user.role))
    redirect("/dashboard/admin");
  redirect("/dashboard/admin");
}
