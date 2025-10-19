"use client";

import * as React from "react";
import { 
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "~/components/ui/card";
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
import { ChevronLeft } from "lucide-react";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { formatYen } from "~/lib/formatters";
import { env } from "~/env";
import type { Cart, Renewal_Student } from "~/app/dashboard/admin/_actions/schemas";

const stripe = loadStripe(env.NEXT_PUBLIC_STRIPE_SANDBOX_PUBLIC_KEY);

export function CheckoutForm({ 
  clientSecret, 
  cart, 
  total,
  renewal_students 
}: {
  clientSecret: string,
  cart: Cart,
  total: number
  renewal_students: Renewal_Student[]
}) {

  if (!cart) return "Cart not found."

  return (
    <>
      <div className="max-w-5xl w-full mx-auto space-y-8">
        <Button variant="outline" className="border-primary" asChild>
          <Link 
            href={`/dashboard/members/order/${cart.user_id}`}
            className="flex items-center gap-x-2" 
          >
            <ChevronLeft />Return to Cart
          </Link>
        </Button>
        <Card className="p-4">
          <CardTitle>Order Summary</CardTitle>
          <CardContent className="flex-col gap-y-4 my-4">
            {cart.new_students && cart.new_students > 0 &&
              <>
                <p className="mt-8 font-bold">New Students</p>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Course</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Price</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>Raz-Japan</TableCell>
                      <TableCell>{cart.new_students}</TableCell>
                      <TableCell>{formatYen(4500)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
                <p className="font-bold">
                  {`New Students Total: ${formatYen(4500*cart.new_students)}`}
                </p>
              </>
            }
            {(cart.renewal_students && cart.renewal_students.length > 0) &&
              <>
              <p className="mt-8 font-bold">Renewal Students</p>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Username</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Order Type</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {renewal_students.map((student) => (
                    <TableRow key={student.student.id}>
                      <TableCell>{student.student.username}</TableCell>
                      <TableCell>¥4,500</TableCell>
                      <TableCell>{student.student.status}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </>
            }
            <div className="mt-8">
              <p className="text-lg font-bold">TOTAL PAYMENT: {formatYen(total)}</p>
            </div>
          </CardContent>
        </Card>
        <Elements options={{ clientSecret }} stripe={stripe}>
          <Form />
        </Elements>
      </div>
    </>
  )
}

function Form() {
  const stripe = useStripe();
  const elements = useElements();

  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string>();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (stripe == null || elements == null) {
      return;
    }

    setIsLoading(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        // Make sure to change this to your payment completion page
        return_url: `http://localhost:3000/dashboard/members/checkout/success`,
      },
    });
    
    if (error.type === "card_error" || error.type === "validation_error") {
      setErrorMessage(error.message);
    } else {
      setErrorMessage("An unexpected error occurred.");
    }

    setIsLoading(false);

  };

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle></CardTitle>
          <CardDescription></CardDescription>
        </CardHeader>
        <CardContent>
          <PaymentElement />
        </CardContent>
        <CardFooter>
          <Button
            className="w-1/2 mx-auto"
            size="lg"
            disabled={stripe == null || elements == null || isLoading}
          >
            Submit Order
          </Button>
        </CardFooter>
      </Card>
    </form>
  )

}