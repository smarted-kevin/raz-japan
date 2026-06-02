import { api } from "@/convex/_generated/api";
import { fetchQuery } from "convex/nextjs";
import { redirect } from "next/navigation";
import { getToken } from "~/lib/auth-server";
import type { Id } from "@/convex/_generated/dataModel";
import {
  AdminDashboard,
  AdminDashboardLoading,
  OrgAdminDashboard,
} from "./_components/adminDashboardHome";

type DashboardStats = {
  activeUsersCount: number;
  totalStudentsCount: number;
  studentsByStatus: {
    active: number;
    inactive: number;
    removed: number;
  };
  studentsExpiringThisMonth: Array<{
    id: string;
    username: string;
    expiry_date: number | undefined;
    status: "active" | "inactive" | "removed";
    course_name: string;
  }>;
  studentsByCourse: Array<{
    course_id: string;
    course_name: string;
    total_students: number;
    active_students: number;
    inactive_students: number;
    removed_students: number;
  }>;
};

type OrgDashboardStats = {
  organizationName: string;
  totalClassrooms: number;
  totalStudentsCount: number;
  studentsByStatus: {
    active: number;
    inactive: number;
    removed: number;
  };
  studentsExpiringThisMonth: Array<{
    id: string;
    username: string;
    expiry_date: number | undefined;
    status: "active" | "inactive" | "removed";
    classroom_name: string;
    course_name: string;
  }>;
  studentsByClassroom: Array<{
    classroom_id: string;
    classroom_name: string;
    course_name: string;
    total_students: number;
    active_students: number;
    inactive_students: number;
    removed_students: number;
  }>;
};

export default async function Page() {
  const token = await getToken();
  if (!token) redirect("/sign-in");

  const user = await fetchQuery(api.auth.getCurrentUser, {}, { token });
  if (!user) redirect("/sign-in");

  const allowedRoles = ["admin", "org_admin", "god"];
  if (!allowedRoles.includes(user.role)) {
    redirect("/sign-in");
  }

  const isOrgAdmin = user.role === "org_admin";

  let orgStats: OrgDashboardStats | null = null;
  let stats: DashboardStats | null = null;

  if (isOrgAdmin) {
    const userDetails = await fetchQuery(api.queries.users.getUserRoleByAuthId, { userId: user._id });
    if (userDetails.org_id) {
      orgStats = await fetchQuery(api.queries.dashboard.getDashboardStatsByOrganization, {
        org_id: userDetails.org_id as Id<"organization">,
      });
    }
  } else {
    const dashboardQuery = (api.queries as unknown as { dashboard: { getDashboardStats: Parameters<typeof fetchQuery>[0] } }).dashboard.getDashboardStats;
    stats = (await fetchQuery(dashboardQuery, {})) as DashboardStats | null;
  }

  if (!stats && !orgStats) {
    return <AdminDashboardLoading />;
  }

  if (isOrgAdmin && orgStats) {
    return <OrgAdminDashboard orgStats={orgStats} />;
  }

  if (stats) {
    return <AdminDashboard stats={stats} />;
  }

  return null;
}
