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

export type StudentData = {
  id: Id<"student">,
  username: string,
  password: string,
  user_id: Id<"user"> | undefined,
  classroom_name: string | undefined,
  expiry_date: number | undefined,
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

export type Course = {
  course_name: string,
  price: number,
  status: "active" | "inactive",
}

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
  user_id: Id<"user">,
  total_amount: number,
  promotion_id: Id<"promotion_code"> | undefined,
  updated_on: number
}

export type Student_Order = {
  student_id: Id<"student">
  amount: number,
  order_id: Id<"full_order">,
  order_type: "new" | "renewal" | "reactivation",
  activation_id: Id<"activation_code"> | undefined,
}