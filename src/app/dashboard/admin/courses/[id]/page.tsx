import { fetchQuery } from "convex/nextjs";
import { redirect, notFound } from "next/navigation";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { getToken } from "~/lib/auth-server";
import { CourseManager } from "~/components/billing/courseManager";
import { AdminSubscriptionsPanel } from "~/components/billing/adminSubscriptionsPanel";
export default async function CourseDetail({
  params,
}: {
  params: Promise<{ id: Id<"course"> }>;
}) {
  const token = await getToken();
  const user = await fetchQuery(api.auth.getCurrentUser, {}, { token });
  if (!user || !["admin", "god"].includes(user.role))
    redirect("/dashboard/admin");
  const { id } = await params;
  const course = await fetchQuery(api.queries.course.getCourseById, { id });
  if (!course) notFound();
  return (
    <main className="space-y-6 p-4 sm:p-6">
      <CourseManager courseId={id} />
      {course.billing_model === "monthly_subscription" && (
        <AdminSubscriptionsPanel courseId={id} />
      )}
    </main>
  );
}
