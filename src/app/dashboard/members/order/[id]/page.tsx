import { type Cart } from "~/app/dashboard/admin/_actions/schemas";
import { MemberOrder } from "../_components/memberOrder";
import type { Id } from "@/convex/_generated/dataModel";
import { api } from "@/convex/_generated/api";
import { fetchMutation, fetchQuery } from "convex/nextjs";
import { redirect } from "next/navigation";
import { getToken } from "~/lib/auth-server";


export default async function OrderPage(
  props: {
    params: Promise<{ id: string }>
  }
) {
  const token = await getToken();
  const session = await fetchQuery(api.auth.getCurrentUser, {}, { token });

  if (!session) redirect('/sign-in');

  const params = await props.params;

  const user = await fetchQuery(
    api.queries.users.getUserWithStudents, { id: params.id as Id<"userTable"> });

  // Ensure user can only access their own order page
  if (!user || user.auth_id !== session._id) redirect('/sign-in');

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

  const cart = await fetchQuery(
    api.queries.cart.getCartByUserId, { id: params.id as Id<"userTable"> });

  return (
    <>
      <MemberOrder user={user} cart={cart as Cart} />
    </>
  )
}