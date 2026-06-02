import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table";
import { dateDisplayFormat } from "~/lib/formatters";
import { Users, GraduationCap, Calendar, BookOpen, Building2 } from "lucide-react";
import { getTranslations } from "next-intl/server";

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

function StatusBadge({
  status,
  label,
}: {
  status: "active" | "inactive" | "removed";
  label: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
        status === "active"
          ? "bg-green-100 text-green-800"
          : status === "inactive"
            ? "bg-yellow-100 text-yellow-800"
            : "bg-gray-100 text-gray-800"
      }`}
    >
      {label}
    </span>
  );
}

export async function AdminDashboardLoading() {
  const t = await getTranslations("dashboard.admin.home");
  return (
    <main className="flex min-h-screen flex-col gap-y-8 p-8 md:p-24">
      <h1 className="font-bold text-2xl">{t("title")}</h1>
      <p>{t("loading")}</p>
    </main>
  );
}

export async function OrgAdminDashboard({ orgStats }: { orgStats: OrgDashboardStats }) {
  const t = await getTranslations("dashboard.admin.home");
  const tc = await getTranslations("dashboard.admin.common");

  return (
    <main className="flex min-h-screen flex-col gap-y-8 p-8 md:p-24">
      <div className="flex items-center gap-2">
        <Building2 className="h-6 w-6" />
        <h1 className="font-bold text-2xl">
          {t("org_title", { organizationName: orgStats.organizationName })}
        </h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("total_classrooms")}</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orgStats.totalClassrooms}</div>
            <p className="text-xs text-muted-foreground">{t("classrooms_in_org")}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("total_students")}</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orgStats.totalStudentsCount}</div>
            <p className="text-xs text-muted-foreground">
              {t("total_students_org_desc", {
                active: orgStats.studentsByStatus.active,
                inactive: orgStats.studentsByStatus.inactive,
              })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("expiring_this_month")}</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orgStats.studentsExpiringThisMonth.length}</div>
            <p className="text-xs text-muted-foreground">{t("expiring_soon")}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("active_students")}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orgStats.studentsByStatus.active}</div>
            <p className="text-xs text-muted-foreground">{t("currently_active")}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("students_expiring_title")}</CardTitle>
        </CardHeader>
        <CardContent>
          {orgStats.studentsExpiringThisMonth.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{tc("username")}</TableHead>
                  <TableHead>{tc("classroom")}</TableHead>
                  <TableHead>{tc("course")}</TableHead>
                  <TableHead>{tc("expiry_date")}</TableHead>
                  <TableHead>{tc("status")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orgStats.studentsExpiringThisMonth.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium">{student.username}</TableCell>
                    <TableCell>{student.classroom_name}</TableCell>
                    <TableCell>{student.course_name}</TableCell>
                    <TableCell>
                      {student.expiry_date ? dateDisplayFormat(student.expiry_date) : tc("na")}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={student.status} label={tc(student.status)} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground">{t("no_students_expiring")}</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("students_by_classroom")}</CardTitle>
        </CardHeader>
        <CardContent>
          {orgStats.studentsByClassroom.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("classroom_name")}</TableHead>
                  <TableHead>{tc("course")}</TableHead>
                  <TableHead>{t("total_students_col")}</TableHead>
                  <TableHead>{tc("active")}</TableHead>
                  <TableHead>{tc("inactive")}</TableHead>
                  <TableHead>{tc("removed")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orgStats.studentsByClassroom.map((classroom) => (
                  <TableRow key={classroom.classroom_id}>
                    <TableCell className="font-medium">{classroom.classroom_name}</TableCell>
                    <TableCell>{classroom.course_name}</TableCell>
                    <TableCell>{classroom.total_students}</TableCell>
                    <TableCell>
                      <span className="text-green-600 font-medium">{classroom.active_students}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-yellow-600 font-medium">{classroom.inactive_students}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-gray-600 font-medium">{classroom.removed_students}</span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground">{t("no_classrooms")}</p>
          )}
        </CardContent>
      </Card>
    </main>
  );
}

export async function AdminDashboard({ stats }: { stats: DashboardStats }) {
  const t = await getTranslations("dashboard.admin.home");
  const tc = await getTranslations("dashboard.admin.common");

  return (
    <main className="flex min-h-screen flex-col gap-y-8 p-8 md:p-24">
      <h1 className="font-bold text-2xl">{t("title")}</h1>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("active_users")}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeUsersCount}</div>
            <p className="text-xs text-muted-foreground">{t("active_users_desc")}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("total_students")}</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStudentsCount}</div>
            <p className="text-xs text-muted-foreground">
              {t("total_students_admin_desc", {
                active: stats.studentsByStatus.active,
                inactive: stats.studentsByStatus.inactive,
                removed: stats.studentsByStatus.removed,
              })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("expiring_this_month")}</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.studentsExpiringThisMonth.length}</div>
            <p className="text-xs text-muted-foreground">{t("expiring_current_month")}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("total_courses")}</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.studentsByCourse.length}</div>
            <p className="text-xs text-muted-foreground">{t("courses_with_students")}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("students_expiring_title")}</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.studentsExpiringThisMonth.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{tc("username")}</TableHead>
                  <TableHead>{tc("course")}</TableHead>
                  <TableHead>{tc("expiry_date")}</TableHead>
                  <TableHead>{tc("status")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.studentsExpiringThisMonth.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium">{student.username}</TableCell>
                    <TableCell>{student.course_name}</TableCell>
                    <TableCell>
                      {student.expiry_date ? dateDisplayFormat(student.expiry_date) : tc("na")}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={student.status} label={tc(student.status)} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground">{t("no_students_expiring")}</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("students_by_course")}</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.studentsByCourse.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("course_name")}</TableHead>
                  <TableHead>{t("total_students_col")}</TableHead>
                  <TableHead>{tc("active")}</TableHead>
                  <TableHead>{tc("inactive")}</TableHead>
                  <TableHead>{tc("removed")}</TableHead>
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
            <p className="text-muted-foreground">{t("no_courses_with_students")}</p>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
