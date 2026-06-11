"use server";

import { fetchMutation, fetchQuery } from "convex/nextjs";
import { z } from "zod";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { getToken } from "~/lib/auth-server";

const ORG_ADMIN_ASSIGNMENT_ATTEMPTS = 20;
const ORG_ADMIN_ASSIGNMENT_RETRY_DELAY_MS = 250;

const assignOrgAdminOrganizationSchema = z.object({
  email: z.string().email(),
  org_id: z.custom<Id<"organization">>(),
});

export type AssignOrgAdminOrganizationForm = z.infer<
  typeof assignOrgAdminOrganizationSchema
>;

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function assignOrgAdminOrganizationForCreatedUser(
  formData: AssignOrgAdminOrganizationForm
): Promise<{ success: true } | { success: false; error: string }> {
  const parsed = assignOrgAdminOrganizationSchema.safeParse(formData);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid organization data",
    };
  }

  const token = await getToken();
  if (!token) {
    return { success: false, error: "Not authenticated" };
  }

  const currentUser = await fetchQuery(api.auth.getCurrentUser, {}, { token });
  if (!currentUser || currentUser.role !== "admin") {
    return { success: false, error: "Admin access required" };
  }

  const { email, org_id } = parsed.data;

  for (let attempt = 1; attempt <= ORG_ADMIN_ASSIGNMENT_ATTEMPTS; attempt++) {
    try {
      const user = await fetchQuery(
        api.queries.users.getUserByEmail,
        { email },
        { token }
      );

      if (!user) {
        throw new Error("User not found");
      }

      await fetchMutation(
        api.mutations.users.updateUserRole,
        {
          userId: user._id,
          role: "org_admin",
          org_id,
        },
        { token }
      );
      return { success: true };
    } catch (caught) {
      if (attempt === ORG_ADMIN_ASSIGNMENT_ATTEMPTS) {
        return {
          success: false,
          error:
            caught instanceof Error
              ? caught.message
              : "Failed to assign organization",
        };
      }
      await wait(ORG_ADMIN_ASSIGNMENT_RETRY_DELAY_MS);
    }
  }

  return { success: false, error: "Failed to assign organization" };
}
