import { 
  type Cart, 
  type UserWithStudentData 
} from "~/app/dashboard/admin/_actions/schemas";
import { MemberOrder } from "../_components/memberOrder";
import type { Id } from "~/convex/_generated/dataModel";
import { api } from "~/convex/_generated/api";
import { fetchQuery } from "convex/nextjs";

export default async function OrderPage({ params }: { 
  params: 
    { id:Id<"user"> }
}) {
  
  const user = await fetchQuery(api.queries.user.getUserWithStudents, { id: params.id });
  const cart = await fetchQuery(api.queries.cart.getCartByUserId, { id: params.id });
  
  if (!user) {
    return <div>User not found.</div>;
  }
  
  return (
    <>
      <MemberOrder user={user} cart={cart as Cart | undefined} />
    </>
  )
}