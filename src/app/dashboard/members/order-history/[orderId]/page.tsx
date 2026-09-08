import { fetchQuery } from "convex/nextjs";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { buttonVariants } from "~/components/ui/button";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { getMemberSession } from "~/lib/member-session";
import { OrderDetails } from "./_components/orderDetails";
import { PrintButton } from "./_components/printButton";
import { getTranslations } from "next-intl/server";

export default async function OrderDetailsPage(props: { params: Promise<{ orderId: string }> }) {
  const { token, session, memberId } = await getMemberSession();

  const params = await props.params;

  const user = await fetchQuery(api.queries.users.getUserById, { id: memberId }, { token });

  if (!user || (user.auth_id != session._id)) redirect('/sign-in');

  const order = await fetchQuery(
    api.queries.full_order.getOrderByIdWithStudentData,
    { id: params.orderId as Id<"full_order"> },
    { token },
  );

  if (!order) {
    redirect("/dashboard/members/order-history");
  }

  // Ensure the order belongs to the user
  if (order.user_id !== memberId) {
    redirect('/sign-in');
  }

  const t = await getTranslations("dashboard.members");

  return (
    <div className="flex flex-col gap-y-4 mx-12 my-6 print:mx-0 print:my-0">
      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center gap-4">
          <Link
            href={"/dashboard/members/order-history"}
            className={buttonVariants({ variant: "outline", size: "icon" })}
            aria-label={t("order_history")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <h1 className="font-bold text-2xl">{t("order_details")}</h1>
        </div>
        <PrintButton />
      </div>
      <div className="p-6 border-2 rounded-lg print:border-0 print:shadow-none print:p-0">
        <OrderDetails order={order} />
      </div>
    </div>
  );
}
