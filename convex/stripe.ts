
"use node";

import { v } from "convex/values";
import { action, internalAction } from "./_generated/server";
import Stripe from "stripe";
import { api, internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import type { FunctionReference } from "convex/server";

type CheckoutSession = Stripe.Checkout.Session;

/*
checkout action does the following:
1. Get cart object from convex
2. Creates document in "full_order" table with cart data
3. Creates stripe checkout session
4. Updates "full_order" document with stripe order id and mark as "pending"
*/
export const checkout = action({
  args: { cart_id: v.id("cart") },
  handler: async (ctx, { cart_id }) => {
    
    console.log("FROM checkout action: " + process.env.STRIPE_SANDBOX_SECRET_KEY);
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.runQuery(api.queries.users.getUserRoleByAuthId, { userId: identity.subject });
    
    //URL and stripe key needed for stripe session
    const domain = process.env.SITE_URL ?? "http://localhost:3000";
    const stripe = new Stripe(process.env.STRIPE_SANDBOX_SECRET_KEY!);

    let stripeCustomerId = user.stripe_id;

    if (!stripeCustomerId || stripeCustomerId == "") {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          user_id: user.user_id,
        },
      });
      stripeCustomerId = customer.id;
      await ctx.runMutation(internal.mutations.users.updateStripeId, {
        userId: user.user_id,
        stripe_id: stripeCustomerId,
      });
    }

    //1. Get cart document by ID
    const cart = await ctx.runQuery(internal.queries.cart.getCartById, {id: cart_id});

    if (!cart || cart == null) return "Cart not found.";

    const renewal_students = cart.renewal_students && 
      cart.renewal_students.length > 0 ? 
      await ctx.runQuery(api.queries.student.getRenewalStudentsWithClassroomAndCourse, 
        { ids: cart.renewal_students as Id<"student">[] }) : 
      [];

    const line_items = [];
    let total_price = 0;
    
    // add renewal student data to line_items array
    if (renewal_students.length > 0) {
      renewal_students.forEach((student) =>{
        if (student.course.price) {
          line_items.push({price: String(student.course.stripe_price_id), quantity: 1});
          total_price += student.course.price;
        }
      });
    }
    //Get Raz-Japan product from Stripe
    const product = await stripe.products.retrieve('prod_SXpH8diltRufBp');
    const priceId = typeof product.default_price === 'string' ? product.default_price : product.default_price?.id;
    const price = priceId ? await stripe.prices.retrieve(priceId) : null;

    //Add new setudents to line_items array
    if(cart.new_students > 0 && priceId) {
      line_items.push({"price": priceId, "quantity": cart.new_students});
      if (price?.unit_amount) {
        total_price = total_price + (price.unit_amount * cart.new_students);
      }
    }

     // 2. Create document in "full_order" table with cart data
     const order = await ctx.runMutation(
      api.mutations.full_order.createFullOrder, 
      {
        user_id: user.user_id,
        total_amount: total_price,
        updated_date: Date.now(),
        status: "created",
        stripe_order_id: "",
      }
    )

    if(!order) return "Something went wrong.";

    //3. Creates stripe checkout session
    const session: CheckoutSession = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      line_items: line_items,
      mode: "payment",
      currency: "JPY",
      success_url: "http://localhost:3000/dashboard/members/checkout/success",
      cancel_url: "http://localhost:3000/dashboard/members/"+user.user_id,
      metadata: {
        cart_id: cart_id,
        user: user.user_id
      }
    });

    if (!session) return "Something went wrong.";
    

    //4. Updates "full_order" document with stripe_order_id and mark as "pending"
    await ctx.runMutation(
      internal.mutations.full_order.updateWithStripeId,
      {
        stripe_order_id: session.id,
        order_id: order
      }
    );

    if (!session?.url) return null;
    
    return session.url;
  }
})

/*  
fulfill internal action does the following:
1. Confirm webhook return from Stripe
2. Mark order as "fulfilled" in DB
3. Create ordered_student documents for each student
4. Run internal mutations to update student info
*/
export const fulfill = internalAction({
  args: { signature: v.string(), payload: v.string() },
  handler: async (ctx, { signature, payload }) => {
    const stripe = new Stripe(process.env.STRIPE_SANDBOX_SECRET_KEY!);
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

    try {
      const event = await stripe.webhooks.constructEventAsync(
        payload,
        signature,
        webhookSecret
      );
      //1. Confirm webhook return from Stripe
      if (event.type === "checkout.session.completed") {
        const stripeId = (event.data.object as { id: string }).id;
        //2. Mark order as "fulfilled" in DB
        const order = await ctx.runMutation(
          internal.mutations.full_order.updateStatus,
          {
            stripe_id: stripeId,
            status: "fulfilled"
          }
        );
        //if (!order || order != typeof v.id("full_order)")) return { success: false, error: "Something went wrong." };

        //3. Create ordered_student documents for each student
        const cart = await ctx.runQuery(internal.queries.cart.getCartById, 
          { id: event.data.object.metadata?.cart_id as Id<"cart"> }
        );
        const ordered_students = [];

        if (!cart || cart == null) return { success: false, error: "Cart not found." };

        const cart_renewal = cart.renewal_students ?? [];
        
        const renewal_students = cart_renewal.length > 0 ? await ctx.runQuery(
          api.queries.student.getRenewalStudentsWithClassroomAndCourse, 
          { ids: cart?.renewal_students as Id<"student">[] }
        ) : [];

        //4. Run internal mutations to update student info
        if (renewal_students.length > 0) {
          await Promise.all(renewal_students.map(async student => {
            if((student.student.id == undefined) || (student.course.price == undefined)) return { success: false, error: "Something went wrong." };
            
            const student_status = student.student.status;
            const order_type = student_status == "removed" ? "reactivation" : "renewal";
            const ordered_student = await ctx.runMutation(
              api.mutations.student_order.createStudentOrder,
              { 
                amount: student.course.price,
                order_type: order_type,
                order_id: order as Id<"full_order">,
                student_id: student.student.id,
                created_date: Date.now(),
                updated_on: Date.now()
              }
            );
            // Update expiry dates and status for renewal students
            if (student_status == "active") {
              const updated_student = await ctx.runMutation(
                api.mutations.student.renewStudent,
                { student_id: student.student.id }
              );
              ordered_students.push(updated_student);

            } else if (student_status == "inactive" || student_status == "removed") {
              const updated_student = await ctx.runMutation(
                api.mutations.student.reactivateStudent,
                { student_id: student.student.id }
              );
              ordered_students.push(updated_student);
            } else return { success: false, error: "Something went wrong." }
          
          }));  
        }
        // Activate students for new students and create ordered students
        if (cart.new_students && cart.new_students > 0 ) {

          for(let i=0; i < cart.new_students; i++) {
            // Get inactive student
            const student = await ctx.runQuery(
              api.queries.student.getAvailableStudent, {}
            );
            // Create ordered_student object
            if (student.student.id != undefined && student.course.price != undefined) {
              const new_student_order = await ctx.runMutation(
                api.mutations.student_order.createStudentOrder,
                {
                  student_id: student.student.id,
                  order_id: order as Id<"full_order">,
                  amount: student.course.price ?? 4500,
                  order_type: "new",
                  created_date: Date.now(),
                  updated_on: Date.now()
                }
              );

              if (!new_student_order) return { success: false, error: "Something went wrong." };
              // Activate student 
              const activated_student = await ctx.runMutation(
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

        // Send payment confirmation email
        if (order) {
          const orderDetails = await ctx.runQuery(
            api.queries.full_order.getOrderById,
            { id: order as Id<"full_order"> }
          );

          if (orderDetails) {
            // Send email asynchronously - don't fail the webhook if email fails
            try {
              // Type assertion needed until Convex regenerates API types
              const emailAction = (internal as {
                email: {
                  sendPaymentConfirmationEmail: FunctionReference<
                    "action",
                    "internal",
                    {
                      userId: Id<"userTable">;
                      orderId: string;
                      totalAmount: number;
                      stripeOrderId?: string;
                    }
                  >;
                };
              }).email.sendPaymentConfirmationEmail;
              await ctx.runAction(emailAction, {
                userId: orderDetails.user_id,
                orderId: String(orderDetails._id),
                totalAmount: orderDetails.total_amount,
                stripeOrderId: stripeId,
              });
            } catch (emailError) {
              // Log error but don't fail the webhook
              console.error("Failed to send payment confirmation email:", emailError);
            }
          }
        }
        
      }
    } catch (err) {
      console.error(err);
      return { success: false, error: (err as { message: string }).message}
    }
    return { success: true };
  }
})

export const createProduct = action({
  args: {
    course_name: v.string(),
    price: v.number()
  },
  handler: async (ctx, {course_name, price}) => {

    const course = await ctx.runMutation(api.mutations.course.createCourse,
      { 
        course_name: course_name,
        price: price
      }
    ) as { course_id?: Id<"course">; error?: string };
    console.log(course);
    if(!course) return "Someting went wrong.";
    
    const stripe = new Stripe(process.env.STRIPE_SANDBOX_SECRET_KEY!);

    const stripeProduct: Stripe.Product = await stripe.products.create({
      name: course_name,
      metadata: {
        course_id: course as Id<"course">
      }
    });
    console.log(stripeProduct);
    if(!stripeProduct) return "No product created.";

    const stripePrice = await stripe.prices.create({
      currency: 'jpy',
      unit_amount: price,
      product: stripeProduct.id,
    });
    console.log("Stripe Price: " + stripePrice.id);
    if(!stripePrice) return "No price created.";

    await ctx.runMutation(internal.mutations.course.updateCourseWithStripe, {
      course_id: course as Id<"course">,
      stripe_product_id: stripeProduct.id,
      stripe_price_id: stripePrice.id
    });
    
    
    return { success: true };

  }
})