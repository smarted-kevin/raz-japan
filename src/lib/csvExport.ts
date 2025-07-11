import { 
  type StudentExportData, 
  type ClassroomExportData, 
  CSVHeaders 
} from "~/app/dashboard/admin/_actions/schemas";

export function convertToCSV(data: ClassroomExportData): string {
  const headers = CSVHeaders;

  const rows = data.students.map(student => [
    student.username,
    "",
    "",
    "",
    "Other",
    "aa",
    student.password,
  ]);
  
  const csvContent = [
    headers.join(','),
    ...rows.map(row => 
      row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(',')
    )
  ].join('\n');

  return csvContent;
}

export function downloadCSV(csvContent: string, filename: string) {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');

  if (link.download !== undefined)  {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}