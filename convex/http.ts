import { httpRouter } from 'convex/server';
import { authComponent, createAuth } from './auth';
import { httpAction } from './_generated/server';
import { internal } from './_generated/api';

const http = httpRouter();

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

authComponent.registerRoutes(http, createAuth, { cors: true });

export default http;