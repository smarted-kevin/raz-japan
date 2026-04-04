import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ArrowLeft } from "lucide-react";
import { PublicNavBar } from "~/components/ui/nav/publicNavBar";

export const metadata = {
  title: "Specified Commercial Transaction Act | Raz-Japan",
  description:
    "Specified Commercial Transaction Act disclosure for Raz-Japan online purchases",
};

export default async function SCTAPage() {
  const t = await getTranslations("SCTA");

  const rows: { labelKey: string; contentKeys: string[] }[] = [
    { labelKey: "seller", contentKeys: ["seller_detail"] },
    { labelKey: "store_director", contentKeys: ["store_director_detail"] },
    { labelKey: "address", contentKeys: ["address_detail"] },
    { labelKey: "phone", contentKeys: ["phone_detail"] },
    { labelKey: "fax", contentKeys: ["fax_detail"] },
    { labelKey: "email", contentKeys: ["email_detail"] },
    { labelKey: "url", contentKeys: ["url_detail"] },
    { labelKey: "ordering_method", contentKeys: ["ordering_method_detail"] },
    { labelKey: "payment", contentKeys: ["payment_detail_1", "payment_detail_2", "payment_detail_3", "payment_detail_4"] },
    {
      labelKey: "delivery",
      contentKeys: ["delivery_school", "delivery_guest"],
    },
    {
      labelKey: "other_costs",
      contentKeys: ["other_costs_1", "other_costs_2", "other_costs_school", "other_costs_guest"],
    },
    {
      labelKey: "returns",
      contentKeys: ["returns_1", "returns_2", "returns_3", "returns_4"],
    },
  ];

  return (
    <main className="min-h-screen overflow-x-hidden bg-white">
      <PublicNavBar />
      <section className="py-16 md:py-24 bg-white">
        <div className="container mx-auto max-w-3xl px-4">
          <Link
            href="/"
            className="mb-8 inline-flex items-center gap-2 text-gray-600 transition-colors hover:text-blue-600"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("back_to_home")}
          </Link>

          <div className="overflow-hidden rounded-2xl border-2 border-gray-200 bg-white shadow-sm hover:border-blue-200 transition-colors">
            <div className="border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-5">
              <h1 className="text-xl font-bold text-gray-900 md:text-2xl">
                {t("title")}
              </h1>
            </div>

            <div className="divide-y divide-gray-100">
              {rows.map(({ labelKey, contentKeys }) => (
                <div
                  key={labelKey}
                  className="grid gap-4 p-6 md:grid-cols-[minmax(0,180px)_1fr] md:gap-6"
                >
                  <dt className="font-medium text-gray-900 md:py-1">
                    {t(`labels.${labelKey}`)}
                  </dt>
                  <dd className="space-y-2 text-gray-700">
                    {contentKeys.map((contentKey) => (
                      <p key={contentKey} className="text-sm leading-relaxed">
                        {t(`content.${contentKey}`)}
                      </p>
                    ))}
                  </dd>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
