import { redirect } from "next/navigation";

export default async function LegacyOrderDetailsPage(props: {
  params: Promise<{ id: string; orderId: string }>;
}) {
  const { orderId } = await props.params;
  redirect(`/dashboard/members/order-history/${encodeURIComponent(orderId)}`);
}
