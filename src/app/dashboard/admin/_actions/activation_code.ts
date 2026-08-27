"use server";

import { fetchMutation } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { getToken } from "~/lib/auth-server";

export type NewActivationCodeForm = {
  quantity: number;
  course_id: Id<"course">;
  organization_id: Id<"organization">;
};

export async function addActivationCodes(formData: NewActivationCodeForm): Promise<string[] | string> {
    const token = await getToken();
    if (!token) return "Not authenticated";
    const result = await fetchMutation(
      api.mutations.activation_code.createActivationCode,
      {
        quantity: formData.quantity ?? 1,
        course_id: formData.course_id,
        organization_id: formData.organization_id,
      },
      { token },
    ) as string[] | [];

    if (!result) return "Something went wrong.";
    return result;
}

