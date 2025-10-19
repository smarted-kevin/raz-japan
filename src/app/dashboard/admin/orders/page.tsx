import OrderTable from "./_components/orderTable";
import { api } from "../../../../../convex/_generated/api";
import { fetchQuery } from "convex/nextjs";
import { type Full_Order } from "../_actions/schemas";
import { getToken } from "~/lib/auth-server";
import { redirect } from "next/navigation";

export default async function OrderPage() {

  const token = await getToken();
  if (!token) redirect("/sign-in");
  if (token) {
    const user = await fetchQuery(api.auth.getCurrentUser, {}, {token});
    if (!user || user.role != "admin") redirect("/sign-in");
  }

  const orders = await fetchQuery(api.queries.full_order.getAllOrders);

  return (
    <>
      <main className="flex min-h-screen flex-col gap-y-8 p-24">
        <h1 className="font-bold text-2xl">ORDERS</h1>
        {orders && <OrderTable orders={orders} /> }
      </main>
    </>
  )
}