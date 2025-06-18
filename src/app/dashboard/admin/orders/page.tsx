import OrderTable from "./_components/orderTable";
import { api } from "~/convex/_generated/api";
import { fetchQuery } from "convex/nextjs";
import { type Full_Order } from "../_actions/schemas";

export default async function OrderPage() {

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