//import { SignInForm } from "~/components/ui/auth/sign-in"; /* SELF-MADE AUTH */
import { SignIn } from "~/components/ui/auth/signIn-Convex"; /* CONVEX AUTH */

export default async function SignInPage() {

  return (
    <div className="flex justify-center items-center my-8 min-w-screen">
      <SignIn />
    </div>
  );
}