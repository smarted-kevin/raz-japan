import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow } from "~/components/ui/table";
import type { ClassroomStudentData } from "../../../_actions/schemas";
import { dateDisplayFormat } from "~/lib/formatters";

export default function ClassroomStudentTable({ students }: { students: ClassroomStudentData[] }) {
  
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Student Username</TableHead>
          <TableHead>Password</TableHead>
          <TableHead>Expiry Date</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {students.map((student) => (
          <TableRow key={student.id}>
            <TableCell>{student.username}</TableCell>
            <TableCell>{student.password}</TableCell>
            <TableCell>{dateDisplayFormat(student.expiry_date) ?? ""}</TableCell>
            <TableCell>{student.status}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}