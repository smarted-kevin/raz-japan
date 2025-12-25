import type { ClassroomStudentData } from "../../../_actions/schemas";

export default function StudentCounts({ students }: { students: ClassroomStudentData[] }) {
  const activeCount = students.filter((s) => s.status === "active").length;
  const inactiveCount = students.filter((s) => s.status === "inactive").length;
  const removedCount = students.filter((s) => s.status === "removed").length;

  return (
    <div className="flex gap-x-8 items-center">
      <div className="flex flex-col">
        <span className="text-sm text-muted-foreground">Active</span>
        <span className="text-2xl font-bold">{activeCount}</span>
      </div>
      <div className="flex flex-col">
        <span className="text-sm text-muted-foreground">Inactive</span>
        <span className="text-2xl font-bold">{inactiveCount}</span>
      </div>
      <div className="flex flex-col">
        <span className="text-sm text-muted-foreground">Removed</span>
        <span className="text-2xl font-bold">{removedCount}</span>
      </div>
    </div>
  );
}

