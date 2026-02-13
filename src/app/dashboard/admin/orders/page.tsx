import OrderTable from "./_components/orderTable";
import { api } from "@/convex/_generated/api";
import { fetchQuery } from "convex/nextjs";
import { getToken } from "~/lib/auth-server";
import { redirect } from "next/navigation";

export default async function OrderPage() {

  const token = await getToken();
  if (!token) redirect("/sign-in");
  const user = await fetchQuery(api.auth.getCurrentUser, {}, { token });
  const allowedRoles = ["admin", "org_admin", "god"];
  if (!user || !allowedRoles.includes(user.role)) redirect("/sign-in");

  //const orders = await fetchQuery(api.queries.full_order.getAllOrders);
  const orders = await fetchQuery(api.queries.full_order.getOrdersWithUserAndStudentData, {});
  if (!orders) return <div>No orders found</div>;
  return (
    <>
      <main className="flex min-h-screen flex-col gap-y-6 p-4 sm:p-6 md:p-8 lg:p-12 xl:p-24">
        <h1 className="font-bold text-2xl">ORDERS</h1>
        {orders && <OrderTable orders={orders} /> }
      </main>
    </>
  )
}