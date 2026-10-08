import { fetchQuery } from "convex/nextjs";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { api } from "@/convex/_generated/api";
import { getToken } from "~/lib/auth-server";
import { CourseManager } from "~/components/billing/courseManager";
export default async function CoursePage() {
  const token = await getToken();
  const user = await fetchQuery(api.auth.getCurrentUser, {}, { token });
  if (!user || !["admin", "god"].includes(user.role))
    redirect("/dashboard/admin");
  const t = await getTranslations("dashboard.admin.courses");
  return (
    <main className="space-y-6 p-4 sm:p-6">
      <h1 className="text-2xl font-bold">{t("title")}</h1>
      <CourseManager />
    </main>
  );
}
