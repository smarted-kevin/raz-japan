import { SignInForm } from "~/components/ui/auth/sign-in";

export default async function SignIn() {

  return (
    <div className="flex justify-center items-center my-8 min-w-screen">
      <SignInForm />
    </div>
  );
}