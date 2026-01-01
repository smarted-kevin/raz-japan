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
import type { Course } from "../../_actions/schemas";
import type { Id } from "convex/_generated/dataModel";

type OrganizationWithId = {
  _id: Id<"organization">;
  organization_name: string;
  status: "active" | "inactive";
};

export type ActivationCodeData = {
  id: string;
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

export default function ActivationCodeTable({
  activationCodes,
  courses,
  orgs,
}: {
  activationCodes: ActivationCodeData[];
  courses: Course[];
  orgs: OrganizationWithId[];
}) {
  const [openState, setOpenState] = React.useState(false);
  const [statusFilter, setStatusFilter] = React.useState<Status>("all");
  const [orgFilter, setOrgFilter] = React.useState<string>("all");

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
          courses={courses}
          orgs={orgs}
          openState={openState}
          setOpenState={setOpenState}
        />
      </div>
      <Table>
        <TableHeader className="bg-primary-foreground">
          <TableRow>
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

