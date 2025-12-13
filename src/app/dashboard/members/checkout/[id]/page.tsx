import Stripe from "stripe";
import { CheckoutForm } from "./_components/checkoutForm";
import { env } from "~/env";
import { fetchQuery } from "convex/nextjs";
import { api } from "../../../../../../convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";
import type { Cart, Renewal_Student } from "~/app/dashboard/admin/_actions/schemas";
import { getToken } from "~/lib/auth-server";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";

const stripe = new Stripe(env.STRIPE_SANDBOX_SECRET_KEY);

export default async function CheckoutPage(
  props: { 
    params: Promise<{ id: string }>
  }
) {
  try {
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
  
    // const renewal_total = renewal_students.reduce((sum, student) => {
    //   if (student.course.price) { return sum + student?.course.price; }
    //   else { return sum; }
    // }, 0);
  
    // const total = renewal_total + ((cart.new_students ?? 0) * 4500);
  
    //Get Raz-Japan product from Stripe
    const product = await stripe.products.retrieve('prod_SXpH8diltRufBp');
  
    //Create line_items array
    const line_items = [];
  
    //Loop through renewal students and push object {price: 4500, quantity: 1} to line_items array
  
    if (renewal_students.length > 0) {
      renewal_students.forEach((student) =>{
        if (student.course.price) {
          line_items.push({price: String(student.course.price), quantity: 1});
        }
      });
    }
  
    //Add new setudents to line_items array
    if(cart.new_students > 0 && product.default_price) {
      const priceId = typeof product.default_price === 'string' ? product.default_price : product.default_price.id;
      line_items.push({"price": priceId, "quantity": cart.new_students});
    }
  
    const session = await stripe.checkout.sessions.create({
      line_items: line_items,
      mode: "payment",
      currency: "JPY",
      success_url: `${process.env.NEXT_PUBLIC_URL}/dashboard/members/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_URL}/dashboard/members/${userTableUser.user_id}`,
    });
  
  
    return new NextResponse(JSON.stringify({ received: true }), { status: 200 });
    
  } catch (err) {
    return NextResponse.json({ error: 'Webhook handler error' }, { status: 500 })
  }
  // const paymentIntent = await stripe.paymentIntents.create({
  //   amount: total,
  //   currency: "JPY",
  //   metadata: {
  //     cart_id: cart.cart_id ?? "",
  //     renewal_students: (cart.renewal_students ?? []).length ?? 0,
  //     new_students: cart.new_students ?? 0 
  //   }
  // })

  // if (paymentIntent.client_secret == null) {
  //   throw Error("Stripe failed to create payment intent")
  // };

  // return (
  //   <CheckoutForm
  //     clientSecret={paymentIntent.client_secret ?? ""}
  //     cart={cart as Cart}
  //     total={total}
  //     renewal_students={renewal_students as Renewal_Student[]}
  //   />
  // )
 

}