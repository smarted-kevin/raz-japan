import { httpRouter } from "convex/server";
import { authComponent, createAuth } from "./auth";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

const http = httpRouter();

const MEMBER_SIGNUP_DISABLED_MESSAGE =
  "Member signups are not currently available.";

http.route({
  path: "/stripe/webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const signature = request.headers.get("stripe-signature")!;
    const result = await ctx.runAction(internal.stripe.fulfill, {
      signature,
      payload: await request.text(),
    });
    if (result.success) {
      return new Response(null, {
        status: 200,
      });
    } else {
      return new Response(result.error ?? "Webhook error", {
        status: 400,
      });
    }
  }),
});

// Exact GET routes take precedence over the Better Auth /api/auth/ prefix.
// Public verification metadata must not contend on a database rate-limit row.
// Keep all account/session endpoints on the normal rate-limited handler below.
for (const path of [
  "/api/auth/convex/jwks",
  "/api/auth/convex/.well-known/openid-configuration",
]) {
  http.route({
    path,
    method: "GET",
    handler: httpAction(async (ctx, request) => {
      return createAuth(ctx, { publicMetadata: true }).handler(request);
    }),
  });
}

// Keep the public registration endpoint closed unless it has been explicitly
// enabled in the Convex deployment environment. This is enforced here rather
// than only in the Next.js UI so direct API requests cannot create accounts.
http.route({
  path: "/api/auth/sign-up/email",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    if (process.env.MEMBER_SIGNUP_ENABLED !== "true") {
      return Response.json(
        {
          code: "MEMBER_SIGNUP_DISABLED",
          message: MEMBER_SIGNUP_DISABLED_MESSAGE,
        },
        { status: 403 },
      );
    }

    return createAuth(ctx).handler(request);
  }),
});

authComponent.registerRoutes(http, createAuth, {
  cors: {
    // Better Auth's `trustedOrigins` is the allowlist. No additional origins,
    // headers, or exposed headers are granted here.
    allowedOrigins: [],
    allowedHeaders: [],
    exposedHeaders: [],
  },
});

export default http;
