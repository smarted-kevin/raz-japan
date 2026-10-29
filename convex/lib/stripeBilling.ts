"use node";

import Stripe from "stripe";
import type { ActionCtx } from "../_generated/server";
import type { Doc } from "../_generated/dataModel";
import { internal } from "../_generated/api";

// Stripe limits each metadata value to 500 characters. Keep every username
// intact, using numbered continuation fields for larger orders.
export function studentUsernameMetadata(usernames: string[]) {
  const metadata: Record<string, string> = {};
  let value = "";
  let field = 1;
  const save = () => {
    metadata[field === 1 ? "student_username" : `student_username_${field}`] =
      value;
    field++;
  };
  for (const username of usernames) {
    if (username.length > 500) throw new Error("Student username is too long");
    if (value && value.length + 2 + username.length > 500) {
      save();
      value = "";
    }
    value = value ? `${value}, ${username}` : username;
  }
  if (value) save();
  // Leave room for order_id, cart_id, and order_number.
  if (Object.keys(metadata).length > 47)
    throw new Error("Too many student usernames for Stripe metadata");
  return metadata;
}

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
