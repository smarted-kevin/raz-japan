import { fetchQuery } from "convex/nextjs";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "~/components/ui/button";
import { api } from "@/convex/_generated/api";
import { type Id } from "convex/_generated/dataModel";
import { getToken } from "~/lib/auth-server";
import { OrderHistoryTable } from "./_components/orderHistoryTable";

export default async function OrderHistoryPage(
  props: { 
    params: Promise<{ id: string }>
  }
) {
  const token = await getToken();
  const session = await fetchQuery(api.auth.getCurrentUser, {}, { token });

  if (!session) redirect('/sign-in');

  const params = await props.params;
  const user = await fetchQuery(api.queries.users.getUserById, { id: params.id as Id<"userTable"> });

  if (!user || (user.auth_id != session._id)) redirect('/sign-in');

  const orders = await fetchQuery(
    api.queries.full_order.getOrdersByUserId, 
    { user_id: params.id as Id<"userTable"> }
  );

  return (
    <div className="flex flex-col gap-y-4 mx-12 my-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href={`/dashboard/members/${params.id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="font-bold text-2xl">Order History</h1>
      </div>
      <div className="p-6 border-2 rounded-lg">
        <OrderHistoryTable orders={orders} />
      </div>
    </div>
  );
}
