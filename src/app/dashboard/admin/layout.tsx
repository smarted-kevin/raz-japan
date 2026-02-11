import Sidebar from "./_components/sidebar";
import MobileSidebar from "./_components/mobileSidebar";
import { SidebarProvider } from "./_components/sidebarContext";
import { SidebarContent } from "./_components/sidebarContent";
import { redirect } from "next/navigation";
import { getToken } from "~/lib/auth-server";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";

type UserRole = "user" | "admin" | "org_admin" | "god";

export default async function AdminLayout({ 
  children 
}: Readonly<{ children: React.ReactNode }> 
) {
  const token = await getToken();
  if (!token) redirect("/sign-in");

  const user = await fetchQuery(api.auth.getCurrentUser, {}, { token });
  if (!user) redirect("/sign-in");

  const allowedRoles: UserRole[] = ["admin", "org_admin", "god"];
  const userRole = user.role as UserRole;
  
  if (!allowedRoles.includes(userRole)) {
    redirect("/sign-in");
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen overflow-hidden">
        {/* Desktop Sidebar */}
        <div className="hidden md:block">
          <Sidebar role={userRole} />
        </div>

        {/* Mobile Top Bar */}
        <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-primary h-16 flex items-center px-4 border-b border-primary-foreground/10">
          <MobileSidebar role={userRole} />
          <h2 className="ml-4 text-lg font-semibold text-white">Admin Dashboard</h2>
        </div>

        {/* Main Content Area */}
        <SidebarContent>
          <div className="container mx-auto w-full px-3 py-4 sm:px-4 sm:py-6 md:px-6 md:py-6">
            {children}
          </div>
        </SidebarContent>
      </div>
    </SidebarProvider>
  )
}