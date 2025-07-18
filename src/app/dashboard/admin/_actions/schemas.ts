import { z } from "zod";
import { type Id } from "~/convex/_generated/dataModel";


export type UserData = {
  id: Id<"user">
  first_name: string,
  last_name: string,
  email: string,
  status: "active" | "inactive"
}

export type BasicUserData = Pick<UserData, 
    "first_name" | "last_name" | "email" | "status"
  >;

export type NewUserForm = {
  first_name: string,
  last_name: string,
  email: string,
  role: "user" | "admin"
}

export const userSchema = z.object({
  first_name: z.string(),
  last_name: z.string(), 
  email: z.string(),
  role: z.enum(["user", "admin"])
})

export type StudentData = {
  id: Id<"student">,
  username: string,
  password: string,
  user_email: string | undefined,
  user_id: Id<"user"> | undefined,
  classroom_name: string | undefined,
  expiry_date: number | undefined,
  status: "active" | "inactive" | "removed"
}

export type UserStudents = Exclude<StudentData, "user_email">;

export type NewStudentData = {
  username: string,
  password: string,
  classroom_id: Id<"classroom"> | undefined,
  course_id: Id<"course"> | undefined,
  status: "active" | "inactive" | "removed"
}

export type UserWithStudentData = UserData & 
  { students: StudentData[] };

export type Classroom = {
  classroom_id: Id<"classroom">,
  classroom_name: string,
  status: "active" | "inactive",
  course_name: string | undefined,
  organization_name: string | undefined,
  active_students: number | undefined,
  inactive_students: number | undefined,
  removed_students: number | undefined,
}

export type NewClassroomForm = {
  classroom_name: string,
  course_name: string,
  organization_name: string,
  student_count: number 
}


export type Course = {
  _id: Id<"course">,
  course_name: string,
  price: number,
  status: "active" | "inactive",
}

export type NewCourseForm = Omit<Course, "course_id">;

export type Organization = {
  organization_name: string,
  status: "active" | "inactive",
}

export type Activation_Code = {
  activation_code: string,
  course: string,
  organization_id: Id<"organization">,
  order_id: Id<"student_order"> | undefined,
  is_activated: boolean,
  activated_date: number | undefined,
  is_removed: boolean,
  is_printed: boolean
}

export type Promotion_Code = {
  promotion_code: string,
  type: "monetary" | "percentage",
  percent_discount: number | undefined,
  monetary_discount: number | undefined,
  times_used: number,
  organization_id: Id<"organization">,
  start_date: number,
  expiry_date: number,
}

export type Cart = {
  user_id: Id<"user">,
  updated_on: number,
  new_students: number | undefined,
}

export type Full_Order = {
  _id: Id<"full_order">,
  user_id: Id<"user">,
  total_amount: number,
  promotion_id?: Id<"promotion_code"> | undefined,
  updated_date: number
}

export type Student_Order = {
  student_id: Id<"student">
  amount: number,
  order_id: Id<"full_order">,
  order_type: "new" | "renewal" | "reactivation",
  activation_id: Id<"activation_code"> | undefined,
}

// CSV export schema
export type StudentExportData = {
  username: string;
  password: string;
}

export type ClassroomExportData = {
  classroom_name: string;
  status: string;
  students: StudentExportData[];
}

export const CSVHeaders = [
  'student login name',
  'first name (optional)',
  'last name (optional)',
  'district student id (optional)',
  'grade (optional)',
  'level (optional)',
  'password'
]