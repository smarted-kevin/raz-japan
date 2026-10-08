import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { getMemberSession } from "~/lib/member-session";
import { CheckoutStatus } from "~/components/billing/checkoutStatus";
import { BatchCheckoutStatus } from "~/components/billing/batchCheckoutStatus";
import type { Id } from "@/convex/_generated/dataModel";
export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ attempt?: string; batch?: string }>;
}) {
  await getMemberSession();
  const params = await searchParams;
  const t = await getTranslations("billing");
  return (
    <main className="mx-auto max-w-2xl space-y-6 p-6">
      {params.batch ? (
        <BatchCheckoutStatus
          batchId={params.batch as Id<"monthly_checkout_batch">}
        />
      ) : params.attempt ? (
        <CheckoutStatus attemptId={params.attempt as Id<"monthly_checkout">} />
      ) : (
        <>
          <h1 className="text-2xl font-bold">{t("order_received")}</h1>
          <p>{t("annual_checkout_note")}</p>
        </>
      )}
      <Link className="text-primary underline" href="/dashboard/members">
        {t("back_members")}
      </Link>
    </main>
  );
}
