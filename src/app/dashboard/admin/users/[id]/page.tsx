import { fetchQuery } from "convex/nextjs";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "~/components/ui/button";
import { api } from "@/convex/_generated/api";
import { type Id } from "convex/_generated/dataModel";
import { getToken } from "~/lib/auth-server";
import { UserInfoCard } from "./_components/userInfoCard";
import { UserStudentsTable } from "./_components/userStudentsTable";
import { UserOrdersSection } from "./_components/userOrdersSection";

const ALLOWED_ROLES = ["admin", "org_admin", "god"] as const;

export default async function AdminUserDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const token = await getToken();
  const session = await fetchQuery(api.auth.getCurrentUser, {}, { token });

  if (!session) redirect("/sign-in");
  if (!ALLOWED_ROLES.includes(session.role as (typeof ALLOWED_ROLES)[number])) {
    redirect("/sign-in");
  }

  const params = await props.params;
  const userId = params.id as Id<"userTable">;
  const user = await fetchQuery(api.queries.users.getUserDetailForAdmin, {
    id: userId,
  });

  if (!user) {
    redirect("/dashboard/admin/users");
  }

  const orders =
    user.role === "user"
      ? await fetchQuery(api.queries.full_order.getOrdersByUserId, {
          user_id: userId,
        })
      : [];

  return (
    <div className="flex flex-col gap-y-6 p-4 sm:p-6 md:p-8 lg:p-12 xl:p-24">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/dashboard/admin/users">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="font-bold text-2xl">User Details</h1>
      </div>

      <UserInfoCard
        userId={user.id}
        firstName={user.first_name}
        lastName={user.last_name}
        email={user.email}
        status={user.status}
        role={user.role}
      />

      {user.role === "user" && (
        <>
          <UserStudentsTable students={user.students} />
          <UserOrdersSection userId={user.id} orders={orders} />
        </>
      )}

      {user.role !== "user" && (
        <p className="text-muted-foreground">
          Students and orders are shown for regular users only. This user has
          role: {user.role}.
        </p>
      )}
    </div>
  );
}
