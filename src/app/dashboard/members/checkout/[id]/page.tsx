import Stripe from "stripe";
import { CheckoutForm } from "./_components/checkoutForm";
import { env } from "~/env";
import { fetchQuery } from "convex/nextjs";
import { api } from "../../../../../../convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";
import type { Cart, Renewal_Student } from "~/app/dashboard/admin/_actions/schemas";
import { getToken } from "~/lib/auth-server";
import { redirect } from "next/navigation";

const stripe = new Stripe(env.STRIPE_SANDBOX_SECRET_KEY);

export default async function CheckoutPage(
  props: { 
    params: Promise<{ id: string }>
  }
) {

  const params = await props.params;

  const token = await getToken();
  const user = await fetchQuery(api.auth.getCurrentUser,{},{token});

  if (!user) return "User not found.";

  const userTableUser = await fetchQuery(api.queries.users.getUserRoleByAuthId, { userId: user._id });
  
  if (!userTableUser) return "User not found.";

  const cart = await fetchQuery(
    api.queries.cart.getCartByUserId, { id: params.id as Id<"userTable">}
  );

  if (!cart || cart == null) return "Cart not found.";

  if (userTableUser.user_id != cart.user_id) redirect(`/dashboard/members/${userTableUser.user_id}`);

  //get students with classroom and course from renewal_students array
  const renewal_students = cart.renewal_students && cart.renewal_students.length > 0 ? await fetchQuery(
    api.queries.student.getRenewalStudentsWithClassroomAndCourse, 
    { ids: cart.renewal_students as Id<"student">[] }
  ) : [];

  const renewal_total = renewal_students.reduce((sum, student) => {
    if (student.course.price) { return sum + student?.course.price; }
    else { return sum; }
  }, 0);

  const total = renewal_total + ((cart.new_students ?? 0) * 4500);

  const paymentIntent = await stripe.paymentIntents.create({
    amount: total,
    currency: "JPY",
    metadata: {
      cart_id: cart.cart_id ?? "",
      renewal_students: (cart.renewal_students ?? []).length ?? 0,
      new_students: cart.new_students ?? 0 
    }
  })

  if (paymentIntent.client_secret == null) {
    throw Error("Stripe failed to create payment intent")
  };

  return (
    <CheckoutForm
      clientSecret={paymentIntent.client_secret ?? ""}
      cart={cart as Cart}
      total={total}
      renewal_students={renewal_students as Renewal_Student[]}
    />
  )

}