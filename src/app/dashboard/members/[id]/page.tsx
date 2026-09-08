import { redirect } from "next/navigation";

export default function LegacyMemberPage() {
  redirect("/dashboard/members");
}
