// app/api/export/classroom/[id]/route.ts
import { type NextRequest, NextResponse } from "next/server";
import { fetchQuery } from "convex/nextjs";
import { api } from "../../../../../../convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { convertToCSV } from "~/lib/csvExport";
import { getToken } from "~/lib/auth-server";



export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> 
}) {

  try {
    const token = await getToken();
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const data = await fetchQuery(api.queries.classroom.classroomExportWithstudents, {
      classroom_id: id as Id<"classroom">,
    }, { token });
    if (!data) {
      return NextResponse.json({ error: "Classroom not found" }, { status: 404 });
    }
    // Convert to CSV (using the same utility function)
    const csvContent = convertToCSV({
      classroom_name: data?.classroom_name ?? "",
      status: data?.status ?? "",
      students: data?.students.map(student => ({
        username: student.username,
        password: student.password
      })) ?? [],
    });

    const safeFilename = data.classroom_name.replace(/[^a-zA-Z0-9_-]/g, "_");
    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${safeFilename}_export.csv"`,
        'Cache-Control': 'no-store, private',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  }
}
