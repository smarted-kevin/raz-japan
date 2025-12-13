import { createClient, type GenericCtx } from "@convex-dev/better-auth";
import { convex } from "@convex-dev/better-auth/plugins";
import { api, components } from "./_generated/api";
import type { Id, DataModel } from "./_generated/dataModel";
import { query } from "./_generated/server";
import { betterAuth, type BetterAuthOptions } from "better-auth";
import { admin, customSession } from "better-auth/plugins";
import { fetchQuery } from "convex/nextjs";
import authSchema from "./betterAuth/schema";
import { requireActionCtx } from "@convex-dev/better-auth/utils";
import { type auth } from "./betterAuth/auth";

const siteUrl = process.env.SITE_URL!;
// The component client has methods needed for integrating Convex with Better Auth,
// as well as helper methods for general use.

const options = {
  //...config options
  plugins: [
    //...plugins
    admin() 
  ]
} satisfies BetterAuthOptions;
export const authComponent = createClient<DataModel, typeof authSchema>(
  components.betterAuth,
  {
    local: {
      schema: authSchema,
    },
  }
);

export const createAuth = (
  ctx: GenericCtx<DataModel>,
  { optionsOnly } = { optionsOnly: false }
) => 
  betterAuth({
    // disable logging when createAuth is called just to generate options.
    // this is not required, but there's a lot of noise in logs without it.
    logger: {
      disabled: optionsOnly,
    },
    baseURL: siteUrl,
    trustedOrigins: [siteUrl],
    database: authComponent.adapter(ctx),
    // Configure simple, non-verified email/password to get started
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
    },
    user: {
      additionalFields: {
        role: {
          type: "string",
          required: true,
          defaultValue: "user",
          input: false,
        }
      }
    },
    databaseHooks: {
      user: {
        create: {
          after: async (user) => {
            const [first_name, last_name]  = user.name.split(" ");
            await requireActionCtx(ctx).runMutation(api.mutations.users.createUser, 
              {
                auth_id: user.id,
                first_name: first_name ?? "",
                last_name: last_name ?? "",
                email: user.email,
                role: user.role as "user" | "admin",
                updated_at: Date.now(),
                status: "active",
              }
            );
            console.log(user);
          }
        },
      }
    },
    ...options,
    plugins: [
      ...(options.plugins ?? []),
      // The Convex plugin is required for Convex compatibility
      convex(),
    ],
  } satisfies BetterAuthOptions);

export type User = (typeof auth.$Infer.Session.user) & 
  { role: "user" | "admin" | "god" };

// Example function for getting the current user
// Feel free to edit, omit, etc.
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    return authComponent.getAuthUser(ctx);
  },
});


