"use client";

import { memo, useTransition, useCallback } from "react";
import {
  TableCell,
  TableRow,
} from "~/components/ui/table";
import { Button } from "~/components/ui/button";
import { Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { dateDisplayFormat } from "~/lib/formatters";
import type { ActivationCodeData } from "./activationCodeTable";

type Status = "used" | "unused" | "removed";

function getStatus(code: ActivationCodeData): Status {
  if (code.removed_date) return "removed";
  if (code.activated_date) return "used";
  return "unused";
}

interface ActivationCodeRowProps {
  code: ActivationCodeData;
  isOrgAdmin: boolean;
}

const ActivationCodeRow = memo(function ActivationCodeRow({ 
  code, 
  isOrgAdmin 
}: ActivationCodeRowProps) {
  const [isPending, startTransition] = useTransition();
  const removeActivationCode = useMutation(api.mutations.activation_code.removeActivationCode);
  const status = getStatus(code);

  const handleRemove = useCallback(() => {
    startTransition(async () => {
      const result = await removeActivationCode({ activation_code_id: code.id });
      if (result.success) {
        toast.success("Activation code removed successfully");
      } else {
        toast.error(result.error);
      }
    });
  }, [code.id, removeActivationCode]);

  return (
    <TableRow>
      <TableCell>
        {status === "unused" && !isOrgAdmin && (
          <Button 
            variant="outline" 
            onClick={handleRemove}
            disabled={isPending}
          >
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
        {code.activated_date ? dateDisplayFormat(code.activated_date) : ""}
      </TableCell>
      <TableCell>
        {code.removed_date ? dateDisplayFormat(code.removed_date) : ""}
      </TableCell>
    </TableRow>
  );
});

export default ActivationCodeRow;
