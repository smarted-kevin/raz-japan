import { redirect } from "next/navigation";

export default function LegacyOrderHistoryPage() {
  redirect("/dashboard/members/order-history");
}
