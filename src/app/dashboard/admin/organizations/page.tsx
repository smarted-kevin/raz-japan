import { fetchQuery } from "convex/nextjs";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { api } from "../../../../../convex/_generated/api";
import { getToken } from "~/lib/auth-server";
import OrganizationTable from "./_components/organizationTable";

export default async function OrganizationsPage() {
  const token = await getToken();
  if (!token) redirect("/sign-in");
  const user = await fetchQuery(api.auth.getCurrentUser, {}, { token });
  if (!user || user.role !== "god") redirect("/sign-in");

  const organizations = await fetchQuery(
    api.queries.organization.getAllOrganizations,
    {},
    { token },
  );
  const t = await getTranslations("dashboard.admin.organizations");

  return (
    <main className="flex min-h-screen flex-col gap-y-6 p-4 sm:p-6 md:p-8 lg:p-12 xl:p-24">
      <h1 className="text-2xl font-bold">{t("title")}</h1>
      <OrganizationTable organizations={organizations} />
    </main>
  );
}
