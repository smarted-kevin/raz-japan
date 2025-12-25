import type { Id } from "@/convex/_generated/dataModel";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Button } from "../button";
import { User } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { SignOutButton } from "../auth/signOut";
import { redirect } from "next/navigation";


export default function UserDropdown({ user }:{user: string}) {

  const user_id = useQuery(api.queries.users.getUserRoleByAuthId, {userId: user});

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" aria-label="Open menu" size="icon">
          <User/>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem 
          onSelect={() => {
            if (user_id && user_id.role == "user") {
              redirect(process.env.SITE_URL ?? "http://localhost:3000" + "/dashboard/members/"+(user_id?.user_id as Id<"userTable">))
            } else if (user_id && user_id.role == "admin") {
              redirect(process.env.SITE_URL ?? "http://localhost:3000" + "/dashboard/admin")
            }
          }}
        >
          Go to Dashboard
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <SignOutButton/>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )

}