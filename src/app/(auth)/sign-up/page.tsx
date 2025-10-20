import SignUp from "./SignUp";
import { PublicNavBar } from "~/components/ui/nav/publicNavBar";

export default async function SignUpPage() {

  return (
    <>
      <PublicNavBar/>
      <div className="flex justify-center items-center my-8 min-w-screen">
        <SignUp />
      </div>
    </>
  );
}