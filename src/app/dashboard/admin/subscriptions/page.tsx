import { AdminSubscriptionsPanel } from "~/components/billing/adminSubscriptionsPanel";
import type { Id } from "@/convex/_generated/dataModel";
export default async function SubscriptionsPage({
  searchParams,
}: {
  searchParams: Promise<{
    student?: string;
    classroom?: string;
    tasks?: string;
  }>;
}) {
  const params = await searchParams;
  return (
    <main className="space-y-6 p-4 sm:p-6">
      <AdminSubscriptionsPanel
        studentId={params.student as Id<"student"> | undefined}
        classroomId={params.classroom as Id<"classroom"> | undefined}
        initialFilter={params.tasks === "true" ? "tasks" : "all"}
      />
    </main>
  );
}
