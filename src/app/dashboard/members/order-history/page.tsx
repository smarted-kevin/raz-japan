import { fetchQuery } from "convex/nextjs";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { buttonVariants } from "~/components/ui/button";
import { api } from "@/convex/_generated/api";
import { getMemberSession } from "~/lib/member-session";
import { OrderHistoryTable } from "./_components/orderHistoryTable";
import { getTranslations } from "next-intl/server";

export default async function OrderHistoryPage() {
  const { token, session, memberId } = await getMemberSession();

  const user = await fetchQuery(api.queries.users.getUserById, { id: memberId }, { token });

  if (!user || (user.auth_id != session._id)) redirect('/sign-in');

  const orders = await fetchQuery(
    api.queries.full_order.getOrdersByUserId, 
    { user_id: memberId },
    { token },
  );

  const t = await getTranslations("dashboard.members");

  return (
    <div className="flex flex-col gap-y-4 mx-12 my-6">
      <div className="flex items-center gap-4">
        <Link
          href={"/dashboard/members"}
          className={buttonVariants({ variant: "outline", size: "icon" })}
          aria-label={t("member_info_title")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="font-bold text-2xl">{t("order_history")}</h1>
      </div>
      <div className="p-6 border-2 rounded-lg">
        <OrderHistoryTable orders={orders} />
      </div>
    </div>
  );
}
