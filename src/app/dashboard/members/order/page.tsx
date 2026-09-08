import { type Cart } from "~/app/dashboard/admin/_actions/schemas";
import { MemberOrder } from "./_components/memberOrder";
import { api } from "@/convex/_generated/api";
import { fetchMutation, fetchQuery } from "convex/nextjs";
import { redirect } from "next/navigation";
import { getMemberSession } from "~/lib/member-session";


export default async function OrderPage() {
  const { token, session, memberId } = await getMemberSession();

  const user = await fetchQuery(
    api.queries.users.getUserWithStudents, { id: memberId }, { token });

  // Ensure user can only access their own order page
  if (!user || user.auth_id !== session._id) redirect('/sign-in');

  const cartExists = await fetchQuery(
    api.queries.cart.userCartExists, { user_id: memberId}, { token })
  
  if (!cartExists) {
    await fetchMutation(
      api.mutations.cart.createCart, 
      {
        user_id: memberId,
        new_students: 0,
        renewal_students: []
      },
      { token },
    )
  };

  const cart = await fetchQuery(
    api.queries.cart.getCartByUserId, { id: memberId }, { token });

  // Capture once on the server so every row hydrates with the same eligibility.
  // eslint-disable-next-line react-hooks/purity
  const renderedAt = Date.now();

  return (
    <>
      <MemberOrder user={user} cart={cart as Cart} renderedAt={renderedAt} />
    </>
  )
}
