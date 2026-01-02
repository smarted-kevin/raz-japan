"use client";

import * as React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import AddActivationCodeDialog from "./addActivationCodeDialog";
import { dateDisplayFormat } from "~/lib/formatters";
import type { Id } from "convex/_generated/dataModel";
import { Button } from "~/components/ui/button";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Trash2Icon } from "lucide-react";
import { toast } from "sonner";

export type ActivationCodeData = {
  id: Id<"activation_code">;
  activation_code: string;
  organization_id: string;
  organization_name: string;
  activated_date: number | undefined;
  removed_date: number | undefined;
  created_date: number;
};

type Status = "used" | "unused" | "removed" | "all";



function getStatus(code: ActivationCodeData): Status {
  if (code.removed_date) return "removed";
  if (code.activated_date) return "used";
  return "unused";
}

export default function ActivationCodeTable() {
  const [openState, setOpenState] = React.useState(false);
  const [statusFilter, setStatusFilter] = React.useState<Status>("all");
  const [orgFilter, setOrgFilter] = React.useState<string>("all");

  // Use reactive queries that automatically update when data changes
  const activationCodes = useQuery(api.queries.activation_code.getAllActivationCodes);
  const courses = useQuery(api.queries.course.getAllCourses);
  const orgs = useQuery(api.queries.organization.getAllOrganizations);

  const removeActivationCode = useMutation(api.mutations.activation_code.removeActivationCode);
  
  // Show loading state while data is being fetched
  if (activationCodes === undefined || courses === undefined || orgs === undefined) {
    return <div>Loading...</div>;
  }

  const filteredCodes = activationCodes.filter((code) => {
    const codeStatus = getStatus(code);
    const statusMatch = statusFilter === "all" || codeStatus === statusFilter;
    const orgMatch =
      orgFilter === "all" || code.organization_name === orgFilter;
    return statusMatch && orgMatch;
  });

  return (
    <>
      <div className="flex gap-x-10 w-3/4 justify-between mb-4">
        <div className="flex gap-x-4">
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as Status)}>
            <SelectTrigger className="min-w-32">
              <SelectValue>Status: {statusFilter === "all" ? "All" : statusFilter}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="used">Used</SelectItem>
              <SelectItem value="unused">Unused</SelectItem>
              <SelectItem value="removed">Removed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={orgFilter} onValueChange={setOrgFilter}>
            <SelectTrigger className="min-w-48">
              <SelectValue>
                Organization: {orgFilter === "all" ? "All" : orgFilter}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Organizations</SelectItem>
              {orgs.map((org) => (
                <SelectItem key={org.organization_name} value={org.organization_name}>
                  {org.organization_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <AddActivationCodeDialog
          courses={courses ?? []}
          orgs={orgs ?? []}
          openState={openState}
          setOpenState={setOpenState}
        />
      </div>
      <Table>
        <TableHeader className="bg-primary-foreground">
          <TableRow>
            <TableHead></TableHead>
            <TableHead>Organization Name</TableHead>
            <TableHead>Activation Code</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Activated Date</TableHead>
            <TableHead>Removed Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredCodes.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center">
                No activation codes found
              </TableCell>
            </TableRow>
          ) : (
            filteredCodes.map((code) => {
              const status = getStatus(code);
              return (
                <TableRow key={code.id}>
                  <TableCell>
                    {status === "unused" && (
                    <Button variant="outline"  onClick={async () => {
                      const result = await removeActivationCode({ activation_code_id: code.id });
                      if (result.success) {
                        toast.success("Activation code removed successfully");
                      } else {
                        toast.error(result.error);
                      }
                    }}>
                      <Trash2Icon className="w-4 h-4 mr-2" />Remove
                    </Button>
                    )}
                  </TableCell>
                  <TableCell>{code.organization_name}</TableCell>
                  <TableCell className="font-mono">{code.activation_code}</TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded text-sm ${
                        status === "used"
                          ? "bg-green-100 text-green-800"
                          : status === "removed"
                          ? "bg-red-100 text-red-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {status}
                    </span>
                  </TableCell>
                  <TableCell>
                    {code.activated_date
                      ? dateDisplayFormat(code.activated_date)
                      : ""}
                  </TableCell>
                  <TableCell>
                    {code.removed_date
                      ? dateDisplayFormat(code.removed_date)
                      : ""}
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </>
  );
}
