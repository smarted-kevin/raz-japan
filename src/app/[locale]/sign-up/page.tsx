import { SignUpForm } from "~/components/ui/auth/sign-up";

export default async function SignUp() {

  return (
    <div className="flex justify-center items-center my-8 min-w-screen">
      <SignUpForm />
    </div>
  );
}