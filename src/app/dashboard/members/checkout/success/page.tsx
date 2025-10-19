import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Button } from "~/components/ui/button";
import Link from "next/link";
import { api } from "../../../../../../convex/_generated/api";
import { fetchQuery } from "convex/nextjs";
import { notFound } from "next/navigation";
import Stripe from "stripe";
import { formatYen } from "~/lib/formatters";
import { env } from "~/env";
import type { Id } from "convex/_generated/dataModel";

const stripe = new Stripe(env.STRIPE_SANDBOX_SECRET_KEY);


export default async function SuccessPage(
  props: { 
    searchParams: Promise<{payment_intent: string}>
  }
) { 

  const searchParams = await props.searchParams;

  const paymentIntent =  await stripe.paymentIntents.retrieve(
    searchParams.payment_intent
  )

  if (paymentIntent.metadata.cart_id == null) { return notFound(); }
  
  const cart = await fetchQuery(
    api.queries.cart.getCartById, 
    { id: paymentIntent.metadata.cart_id as Id<"cart"> }
  );

  const user = await fetchQuery(
    api.queries.users.getUserById,
    { id: cart?.user_id as Id<"userTable">}
  );

  const renewal_students = await fetchQuery(
    api.queries.student.getRenewalStudentsWithClassroomAndCourse, 
    { ids: cart?.renewal_students as Id<"student">[] }
  );

  const isSuccess = paymentIntent.status === "succeeded";

  if (!isSuccess) return "Something went wrong.";

  return (
    <div className="mx-20">
      <div className="flex flex-col gap-y-4 mb-10">
        <h2 className="text-3xl font-bold">Success!</h2>
        <h4 className="text-xl">{`Thank you for your order, ${user?.first_name}!`}</h4>
      </div>
      <div className="flex flex-col gap-y-4">
        <h2 className="text-xl font-bold">Order Contents:</h2>
        <div>
          <h4 className="font-bold">New Students:</h4>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Quantity</TableHead>
                <TableHead>Price Per Student</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>{cart?.new_students}</TableCell>
                <TableCell>{formatYen(4500)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
        <div>
          <h4 className="font-bold">Renewal Students:</h4>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Username</TableHead>
                <TableHead>Classroom Name</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {renewal_students.map((student) => (
                <TableRow key={student.student.id}>
                  <TableCell>{student.student.username}</TableCell>
                  <TableCell>{student.classroom.classroom_name}</TableCell>
                  <TableCell>{student.student.status}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <Button className="w-2/3 min-w-min mx-auto mt-4" asChild>
          <Link 
            href={`/dashboard/members/${user?._id}`}
          >
          See All your student information on your Member page
          </Link>
        </Button>
      </div>

    </div>
  )
}