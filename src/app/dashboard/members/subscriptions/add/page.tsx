import { getMemberSession } from "~/lib/member-session";
import { AddMonthlySubscriptions } from "./_components/addMonthlySubscriptions";

export default async function AddMonthlySubscriptionsPage() {
  await getMemberSession();
  return <AddMonthlySubscriptions />;
}
