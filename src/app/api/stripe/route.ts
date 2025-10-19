import { type NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
//import { stripe } from "~/lib/stripe";
import { env } from "~/env";
import Stripe from "stripe";
//import { ConvexHttpClient } from "convex/browser";
import { fetchMutation, fetchQuery } from "convex/nextjs";
import { api } from "convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";

//const convex = new ConvexHttpClient(env.NEXT_PUBLIC_CONVEX_URL);
const stripe = new Stripe(env.STRIPE_SANDBOX_SECRET_KEY);

export async function POST(req: NextRequest) {
  
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      await req.text(),
      (await headers()).get('stripe-signature') as string | Buffer,
      env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    // On error, log and return the error message.
    if (err) console.log(err)
    console.log(`Error message: ${errorMessage}`)
    return NextResponse.json(
      { message: `Webhook Error: ${errorMessage}` },
      { status: 400 }
    );
  }

  if (event.type === "payment_intent.succeeded") {
    const charge = event.data.object
    const cart_id = charge.metadata.cart_id as Id<"cart">;
    
    // Check if cart object exists and get object
    const cart = await fetchQuery(
      api.queries.cart.getCartById,
      { id: cart_id }
    )
    if (cart == null) {
      return new NextResponse("Bad Request", { status: 400 })
    };
    
    //create new order 
    const order = await fetchMutation(
      api.mutations.full_order.createFullOrder,
      { 
        user_id: cart.user_id as Id<"users">,
        total_amount: 0,
        updated_date: Date.now()
      }
    )

    // Add order id to stripe payment intent metadata
    const intent = event.data.object;

    if (intent) {
      const paymentIntent = await stripe.paymentIntents.update(
        intent.id,
        {
          metadata: {
            order_id: order
          }
        } 
      )
      console.log("PAYMENT_INTENT: " + paymentIntent.id)
    }

    // Array to collect all student objects
    const ordered_students = [];

    // Create ordered student for renewal students and update student object
    const renewal_students = await fetchQuery(
      api.queries.student.getRenewalStudentsWithClassroomAndCourse,
      { ids: cart.renewal_students as Id<"student">[] }
    );

    if (renewal_students && renewal_students.length > 0 ) {
      await Promise.all(renewal_students.map(async student => {

        if((student.student.id == undefined) || (student.course.price == undefined) || order == undefined ) return "student not found";
        //Create ordered student

        const student_status = student.student.status;
        const order_type = student_status == "removed" ? "reactivation" : "renewal";
        const ordered_student = await fetchMutation(
          api.mutations.student_order.createStudentOrder,
          { 
            amount: student.course.price,
            order_type: order_type,
            order_id: order,
            student_id: student.student.id,
            created_date: Date.now(),
            updated_on: Date.now()
          }
        );
        if (!ordered_student) return "Something went wrong with ordered student."
          
        // Update expiry dates and status for renewal students
        if (student_status == "active") {
          const updated_student = await fetchMutation(
            api.mutations.student.renewStudent,
            { student_id: student.student.id }
          );
          ordered_students.push(updated_student);

        } else if (student_status == "inactive" || student_status == "removed") {
          const updated_student = await fetchMutation(
            api.mutations.student.reactivateStudent,
            { student_id: student.student.id }
          );
          ordered_students.push(updated_student);
        } else return "Something went wrong with updating student."
      })
    )}
    
    // Activate students for new students and create ordered students
    if (cart.new_students && cart.new_students > 0 ) {

      for(let i=0; i < cart.new_students; i++) {
        // Get inactive student
        const student = await fetchQuery(
          api.queries.student.getAvailableStudent, {}
        );
        // Create ordered_student object
        if (student.student.id != undefined && student.course.price != undefined) {
          const new_student_order = await fetchMutation(
            api.mutations.student_order.createStudentOrder,
            {
              student_id: student.student.id,
              order_id: order,
              amount: student.course.price ?? 4500,
              order_type: "new",
              created_date: Date.now(),
              updated_on: Date.now()
            }
          );

          if (!new_student_order) return "Something went wrong with new student order.";
          // Activate student 
          const activated_student = await fetchMutation(
            api.mutations.student.activateStudent,
            { 
              student_id: student.student.id,
              user_id: cart.user_id
             }
          );

          ordered_students.push(activated_student);
        }
      }
    }
    // Update order with total price
    const order_total = await fetchMutation(
      api.mutations.full_order.updateDateOrderPrice, { order_id: order }
    );
    console.log(`ORDER TOTAL: ${order_total?.total_amount}`);
    // Send confirmation email to user with student information and payment details
    
  }
  return new NextResponse();
}