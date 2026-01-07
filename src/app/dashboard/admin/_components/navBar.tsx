import DashboardLocaleSwitcher from "../../dashboardLocaleSwitcher";
import NavLinks from "./navLinks";
import { SignOutButton } from "~/components/ui/auth/signOut";

type UserRole = "user" | "admin" | "org_admin" | "god";

interface TopNavProps {
  role: UserRole;
}

export default async function TopNav({ role }: TopNavProps) {

  return (
    <div className="bg-primary h-12">
      <div className="flex justify-center gap-x-8 items-center text-white h-full">
        <NavLinks role={role} />
        <DashboardLocaleSwitcher />
        <SignOutButton />
      </div>
    </div>
  )
}
