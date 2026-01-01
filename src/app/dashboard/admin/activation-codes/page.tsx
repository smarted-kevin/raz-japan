import ActivationCodeTable from "./_components/activationCodeTable";
import { api } from "../../../../../convex/_generated/api";
import { fetchQuery } from "convex/nextjs";
import { redirect } from "next/navigation";
import { getToken } from "~/lib/auth-server";

export default async function ActivationCodePage() {
  const token = await getToken();
  if (!token) redirect("/sign-in");
  if (token) {
    const user = await fetchQuery(api.auth.getCurrentUser, {}, { token });
    if (!user || user.role != "admin") redirect("/sign-in");
  }

  const [activationCodes, courses, orgs] = await Promise.all([
    fetchQuery(api.queries.activation_code.getAllActivationCodes),
    fetchQuery(api.queries.course.getAllCourses),
    fetchQuery(api.queries.organization.getAllOrganizations),
  ]);

  return (
    <>
      <main className="flex min-h-screen flex-col gap-y-8 p-24">
        <h1 className="font-bold text-2xl">ACTIVATION CODES</h1>
        {activationCodes && (
          <ActivationCodeTable
            activationCodes={activationCodes}
            courses={courses}
            orgs={orgs}
          />
        )}
      </main>
    </>
  );
}

