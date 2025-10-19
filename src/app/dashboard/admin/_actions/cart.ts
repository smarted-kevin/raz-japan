"use server";

import { fetchMutation, fetchQuery } from "convex/nextjs";
import { api } from "convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";

export async function updateCart({
  user_id, 
  cart_id, 
  new_students, 
  renewal_students
}: {
  user_id: Id<"userTable">,
  cart_id: Id<"cart"> | undefined,
  new_students: number | undefined,
  renewal_students: Id<"student">[] | undefined
}) {
  const cart = await fetchQuery(api.queries.cart.getCartByUserId, { id: user_id });


  if (!cart) return "Cart not found."

  if (cart?.cart_id != cart_id) return "Cart Ids do not match";

  const updated_cart = await fetchMutation(
    api.mutations.cart.updateCart,
    { cart_id: cart_id ?? cart.cart_id,
      user_id: user_id,
      new_students: new_students ?? cart.new_students,
      renewal_students: renewal_students ?? cart.renewal_students
    }
  )
  
  return updated_cart;
}