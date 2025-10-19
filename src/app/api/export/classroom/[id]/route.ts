// app/api/export/classroom/[id]/route.ts
import { type NextRequest, NextResponse } from "next/server";
import { fetchQuery } from "convex/nextjs";
import { api } from "../../../../../../convex/_generated/api";
import {type Id } from "convex/_generated/dataModel";
import { convertToCSV } from "~/lib/csvExport";



export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> 
}) {

  try {
    const { id } = await params;
    console.log("CLASSROOM_ID: " + id);
    const data = await fetchQuery(api.queries.classroom.classroomExportWithstudents, {
      classroom_id: id as Id<"classroom">,
    });
    // Convert to CSV (using the same utility function)
    const csvContent = convertToCSV({
      classroom_name: data?.classroom_name ?? "",
      status: data?.status ?? "",
      students: data?.students.map(student => ({
        username: student.username,
        password: student.password
      })) ?? [],
    });

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${data?.classroom_name}_export.csv"`,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  }
}