import DashboardLocaleSwitcher from "../../dashboardLocaleSwitcher";
import NavLinks from "./navLinks";
import { SignOutButton } from "~/components/ui/auth/signOut";


export default async function TopNav() {

  return (
    <div className="bg-primary h-12">
      <div className="flex justify-center gap-x-8 items-center text-white h-full">
        <NavLinks />
        <DashboardLocaleSwitcher />
        <SignOutButton />
      </div>
    </div>
  )
}
