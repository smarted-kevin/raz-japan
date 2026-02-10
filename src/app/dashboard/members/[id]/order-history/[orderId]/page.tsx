import { fetchQuery } from "convex/nextjs";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "~/components/ui/button";
import { api } from "@/convex/_generated/api";
import { type Id } from "convex/_generated/dataModel";
import { getToken } from "~/lib/auth-server";
import { OrderDetails } from "./_components/orderDetails";
import { PrintButton } from "./_components/printButton";

export default async function OrderDetailsPage(
  props: { 
    params: Promise<{ id: string; orderId: string }>
  }
) {
  const token = await getToken();
  const session = await fetchQuery(api.auth.getCurrentUser, {}, { token });

  if (!session) redirect('/sign-in');

  const params = await props.params;
  const user = await fetchQuery(api.queries.users.getUserById, { id: params.id as Id<"userTable"> });

  if (!user || (user.auth_id != session._id)) redirect('/sign-in');

  const order = await fetchQuery(
    api.queries.full_order.getOrderByIdWithStudentData,
    { id: params.orderId as Id<"full_order"> }
  );

  if (!order) {
    redirect(`/dashboard/members/${params.id}/order-history`);
  }

  // Ensure the order belongs to the user
  if (order.user_id !== params.id) {
    redirect('/sign-in');
  }

  return (
    <div className="flex flex-col gap-y-4 mx-12 my-6 print:mx-0 print:my-0">
      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href={`/dashboard/members/${params.id}/order-history`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="font-bold text-2xl">Order Details</h1>
        </div>
        <PrintButton />
      </div>
      <div className="p-6 border-2 rounded-lg print:border-0 print:shadow-none print:p-0">
        <OrderDetails order={order} />
      </div>
    </div>
  );
}
