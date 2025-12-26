import { api } from "@/convex/_generated/api";
import { fetchQuery } from "convex/nextjs";
import { redirect } from "next/navigation";
import { getToken } from "~/lib/auth-server";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table";
import { dateDisplayFormat } from "~/lib/formatters";
import { Users, GraduationCap, Calendar, BookOpen } from "lucide-react";

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

export default async function Page() {
  const token = await getToken();
  if (!token) redirect("/sign-in");
  if (token) {
    const user = await fetchQuery(api.auth.getCurrentUser, {}, {token});
    if (!user || user.role != "admin") redirect("/sign-in");
  }

  // TypeScript error expected until Convex regenerates API types for dashboard query
  const dashboardQuery = (api.queries as unknown as { dashboard: { getDashboardStats: Parameters<typeof fetchQuery>[0] } }).dashboard.getDashboardStats;
  const stats = (await fetchQuery(dashboardQuery, {})) as DashboardStats | null;
  
  if (!stats) {
    return (
      <main className="flex min-h-screen flex-col gap-y-8 p-8 md:p-24">
        <h1 className="font-bold text-2xl">Dashboard</h1>
        <p>Loading dashboard statistics...</p>
      </main>
    );
  }
  
  return ( 
    <main className="flex min-h-screen flex-col gap-y-8 p-8 md:p-24">
      <h1 className="font-bold text-2xl">Dashboard</h1>
      
      {/* Summary Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeUsersCount}</div>
            <p className="text-xs text-muted-foreground">
              Users with active status
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStudentsCount}</div>
            <p className="text-xs text-muted-foreground">
              {stats.studentsByStatus.active} active, {stats.studentsByStatus.inactive} inactive, {stats.studentsByStatus.removed} removed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expiring This Month</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.studentsExpiringThisMonth.length}</div>
            <p className="text-xs text-muted-foreground">
              Students expiring in current month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.studentsByCourse.length}</div>
            <p className="text-xs text-muted-foreground">
              Courses with students
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Students Expiring This Month */}
      <Card>
        <CardHeader>
          <CardTitle>Students Expiring This Month</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.studentsExpiringThisMonth.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Username</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Expiry Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.studentsExpiringThisMonth.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium">{student.username}</TableCell>
                    <TableCell>{student.course_name}</TableCell>
                    <TableCell>
                      {student.expiry_date ? dateDisplayFormat(student.expiry_date) : "N/A"}
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                        student.status === "active" 
                          ? "bg-green-100 text-green-800" 
                          : student.status === "inactive"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-gray-100 text-gray-800"
                      }`}>
                        {student.status}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground">No students expiring this month.</p>
          )}
        </CardContent>
      </Card>

      {/* Students by Course */}
      <Card>
        <CardHeader>
          <CardTitle>Students by Course</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.studentsByCourse.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Course Name</TableHead>
                  <TableHead>Total Students</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead>Inactive</TableHead>
                  <TableHead>Removed</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.studentsByCourse.map((course) => (
                  <TableRow key={course.course_id}>
                    <TableCell className="font-medium">{course.course_name}</TableCell>
                    <TableCell>{course.total_students}</TableCell>
                    <TableCell>
                      <span className="text-green-600 font-medium">{course.active_students}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-yellow-600 font-medium">{course.inactive_students}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-gray-600 font-medium">{course.removed_students}</span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground">No courses with students found.</p>
          )}
        </CardContent>
      </Card>
    </main>
  )
}