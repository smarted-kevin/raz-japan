import { type Cart } from "~/app/dashboard/admin/_actions/schemas";
import { MemberOrder } from "../_components/memberOrder";
import type { Id } from "convex/_generated/dataModel";
import { api } from "convex/_generated/api";
import { fetchMutation, fetchQuery } from "convex/nextjs";


export default async function OrderPage(
  props: {
    params: Promise<{ id: string }>
  }
) {
  const params = await props.params;

  const cartExists = await fetchQuery(
    api.queries.cart.userCartExists, { user_id: params.id as Id<"userTable">})
  

  if (!cartExists) {
    await fetchMutation(
      api.mutations.cart.createCart, 
      {
        user_id: params.id as Id<"userTable">,
        new_students: 0,
        renewal_students: []
      }
    )
  };

  const user = await fetchQuery(
    api.queries.users.getUserWithStudents, { id: params.id as Id<"userTable"> });
  const cart = await fetchQuery(
    api.queries.cart.getCartByUserId, { id: params.id as Id<"userTable"> });

  if (!user) {
    return <div>User not found.</div>;
  }

  return (
    <>
      <MemberOrder user={user} cart={cart as Cart} />
    </>
  )
}