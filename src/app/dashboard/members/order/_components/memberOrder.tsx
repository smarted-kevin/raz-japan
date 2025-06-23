"use client";

import * as React from "react";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import Link from "next/link";
import { RenewalStudentRow } from "./renewalStudentRow";
import { useRouter } from "next/navigation";
import type { Cart, UserWithStudentData } from "~/app/dashboard/admin/_actions/schemas";
import type { Id } from "~/convex/_generated/dataModel";

export function MemberOrder({ user, cart }:{user:UserWithStudentData, cart:Cart | undefined}) {
  const router = useRouter();

  const [newStudents, setNewStudents] = React.useState(cart?.new_students ?? 0);
  const [existingStudents, setExistingStudents] = React.useState<Id<"student">[]>([]);

  const handleChange = (value:Id<"student">, checked:boolean) => {
    if (checked) {  
      setExistingStudents([...existingStudents, value])
    } else {
      setExistingStudents(existingStudents.filter(student => student !== value ));
    }
  }

  return (
    <>
      <div className="flex flex-col gap-y-12 mx-20">
        <h1 className="text-xl font-bold">ORDERING</h1>
        <div className="flex flex-col gap-y-8">
          <div className="flex flex-col gap-y-4">
            <h3 className="text-lg font-bold">Add New Students: </h3>
            <p className="text-sm">Select number of new students to add to your account.</p>
            <div className="flex items-center gap-x-8">
              <span className="font-semibold">Number of New Students: </span>
              <Input name="newStudents" 
                onChange={e => setNewStudents(parseInt(e.currentTarget.value))}
                defaultValue={cart?.new_students ?? 0 } 
                type="number" 
                min="0" 
                max="5" 
                className="w-min" 
              />
            </div>
          </div>
          <div className="flex flex-col gap-y-4">
            <h3 className="text-lg font-bold">Current / Expired Students: </h3>
            <p className="text-sm">Extend current students expiry date for 1 year, or reactivate expired student accounts.</p>
            <div className="flex items-center gap-x-8">
              <Table>
                <TableHeader>
                  <TableRow className="bg-secondary">
                    <TableHead className="text-primary font-bold"></TableHead>
                    <TableHead className="text-primary font-bold">Status</TableHead>
                    <TableHead className="text-primary font-bold">Classroom</TableHead>
                    <TableHead className="text-primary font-bold">Username</TableHead>
                    <TableHead className="text-primary font-bold">Expiry Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {user?.students.map((student) => 
                    <RenewalStudentRow key={student.id} student={student} onChange={handleChange} existingStudents={existingStudents} />
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
        <Button 
          type="button" 
          className="w-1/2 mx-auto"
          disabled={newStudents == 0 && existingStudents.length < 1}
          asChild
        >
          <Link href={`${process.env.NEXT_PUBLIC_SERVER_URL}/members/checkout/${user.id}`}>
            Proceed to Checkout
          </Link>
        </Button>
      </div>
    </>
  )
}