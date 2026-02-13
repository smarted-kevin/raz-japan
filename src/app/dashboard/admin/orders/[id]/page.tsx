import { fetchQuery } from "convex/nextjs";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "~/components/ui/button";
import { api } from "@/convex/_generated/api";
import { type Id } from "convex/_generated/dataModel";
import { getToken } from "~/lib/auth-server";
import { AdminOrderDetails } from "./_components/adminOrderDetails";
import { PrintButton } from "./_components/printButton";

const ALLOWED_ROLES = ["admin", "org_admin", "god"] as const;

export default async function AdminOrderDetailsPage(props: {
  params: Promise<{ id: string }>;
}) {
  const token = await getToken();
  const session = await fetchQuery(api.auth.getCurrentUser, {}, { token });

  if (!session) redirect("/sign-in");
  if (!ALLOWED_ROLES.includes(session.role as (typeof ALLOWED_ROLES)[number])) {
    redirect("/sign-in");
  }

  const params = await props.params;
  const order = await fetchQuery(
    api.queries.full_order.getOrderByIdWithUserAndStudentData,
    { id: params.id as Id<"full_order"> }
  );

  if (!order) {
    redirect("/dashboard/admin/orders");
  }

  return (
    <div className="flex flex-col gap-y-4 print:gap-y-0">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between print:hidden">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/dashboard/admin/orders">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="font-bold text-xl sm:text-2xl">Order Details</h1>
        </div>
        <PrintButton />
      </div>
      <AdminOrderDetails order={order} />
    </div>
  );
}
