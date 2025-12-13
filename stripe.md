*PAYMENT FLOW* 
(from https://stack.convex.dev/stripe-with-convex#step-3-receiving-the-payment-confirmation)

STEP 1:  Initiate checkout flow
1. Create document in "full_order" table to track payment progress
2. Call stripe SDK to get checkout page URL
3. include ID of "full_order" document in success_url that stripe redirects to
4. Write stripe checkout session ID to "full_order document to ensure only fulfilled once

STEP 2: Payment Checkout flow 
All done by Stripe

STEP 3:  Receiving the payment confirmation
1. Expose and HTTP endpoint that stripe's servers can hit whenever a user finishes a payment
(use convex httpaction??)

2. Use internal action to verify the payment and call internal mutation to update the payment document, and perform any other operations (activating students, updating student expiry dates, etc.)

**WHAT NEEDS TO BE DONE**
1. Add "stripe_id" column to full_order table [x] 
2. Create internal action to confirm stripe payment
3. Create internal mutation to activate students, update student data, update full_order documents