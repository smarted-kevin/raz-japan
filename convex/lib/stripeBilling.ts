"use node";

import Stripe from "stripe";
import type { ActionCtx } from "../_generated/server";
import type { Doc } from "../_generated/dataModel";
import { internal } from "../_generated/api";

export function stripeClient() {
  const secret =
    process.env.STRIPE_SECRET_KEY ?? process.env.STRIPE_SANDBOX_SECRET_KEY;
  if (!secret) throw new Error("Stripe secret key is required");
  return new Stripe(secret, { apiVersion: "2025-05-28.basil" });
}

export async function ensureCustomer(
  ctx: ActionCtx,
  stripe: Stripe,
  user: Doc<"userTable">,
) {
  if (user.stripe_id) return user.stripe_id;
  const customer = await stripe.customers.create(
    {
      name: `${user.first_name} ${user.last_name}`,
      email: user.email,
      metadata: { user_id: user._id },
    },
    { idempotencyKey: `raz-customer:${user._id}` },
  );
  await ctx.runMutation(internal.mutations.users.updateStripeId, {
    userId: user._id,
    stripe_id: customer.id,
  });
  return customer.id;
}
