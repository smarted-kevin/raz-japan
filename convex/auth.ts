import { createClient, type GenericCtx } from "@convex-dev/better-auth";
import { convex } from "@convex-dev/better-auth/plugins";
import { components, internal } from "./_generated/api";
import type { DataModel } from "./_generated/dataModel";
import { query } from "./_generated/server";
import { betterAuth, type BetterAuthOptions } from "better-auth";
import { admin } from "better-auth/plugins";
import authSchema from "./betterAuth/schema";
import { requireActionCtx } from "@convex-dev/better-auth/utils";

type CreatedAuthUser = {
  id: string;
  name: string;
  email: string;
  role?: string;
};

const getSiteUrl = () => {
  const configuredUrl = process.env.SITE_URL?.trim();
  const fallbackUrl = "http://localhost:3000";

  try {
    const url = new URL(configuredUrl || fallbackUrl);
    const isLocal = url.hostname === "localhost" || url.hostname === "127.0.0.1";
    if (!isLocal && url.protocol !== "https:") {
      throw new Error("SITE_URL must use HTTPS outside local development");
    }
    return url.origin;
  } catch {
    if (configuredUrl) throw new Error("SITE_URL must be a valid HTTPS origin");
    return fallbackUrl;
  }
};

const siteUrl = getSiteUrl();
const siteOrigin = new URL(siteUrl);
const trustedOrigins = [siteOrigin.origin];

if (siteOrigin.hostname === "localhost" || siteOrigin.hostname === "127.0.0.1") {
  trustedOrigins.push("http://localhost:3000", "http://127.0.0.1:3000");
}

function requireTrustedAuthUrl(url: string): string {
  const parsed = new URL(url);
  if (parsed.origin !== siteOrigin.origin) {
    throw new Error("Refusing to send an authentication link for an untrusted origin");
  }
  return parsed.toString();
}
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
    trustedOrigins: Array.from(new Set(trustedOrigins)),
    database: authComponent.adapter(ctx),
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 12,
      maxPasswordLength: 128,
      sendResetPassword: async ({ user, url }) => {
        await requireActionCtx(ctx).runAction(internal.authEmail.sendAuthEmail, {
          kind: "password_reset",
          email: user.email,
          name: user.name,
          url: requireTrustedAuthUrl(url),
        });
      },
      resetPasswordTokenExpiresIn: 30 * 60,
      revokeSessionsOnPasswordReset: true,
    },
    rateLimit: {
      enabled: true,
      storage: "database",
      window: 60,
      max: 60,
      customRules: {
        "/sign-in/email": { window: 60, max: 5 },
        "/sign-up/email": { window: 60 * 60, max: 5 },
        "/request-password-reset": { window: 60 * 60, max: 3 },
        "/forget-password": { window: 60 * 60, max: 3 },
        "/reset-password": { window: 60 * 60, max: 5 },
      },
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
            const createdUser = user as CreatedAuthUser;
            const role = createdUser.role as "user" | "admin" | "org_admin" | undefined;
            const [first_name, last_name]  = user.name.split(" ");
            await requireActionCtx(ctx).runMutation(internal.mutations.users.createUser, 
              {
                auth_id: user.id,
                first_name: first_name ?? "",
                last_name: last_name ?? "",
                email: user.email,
                role,
                updated_at: Date.now(),
                status: "active",
              }
            );
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

export type User = {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image?: string | null;
  createdAt: Date;
  updatedAt: Date;
  role: "user" | "admin" | "org_admin" | "god";
};

// Example function for getting the current user
// Feel free to edit, omit, etc.
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    return authComponent.getAuthUser(ctx);
  },
});


