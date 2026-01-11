import { httpRouter } from 'convex/server';
import { authComponent, createAuth } from './auth';
import { httpAction } from './_generated/server';
import { internal } from './_generated/api';
import type { Id } from './_generated/dataModel';

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

// Public endpoint to get storage URL (no auth required)
http.route({
  path: "/public/storage-url",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const storageId = url.searchParams.get("id");
    
    if (!storageId) {
      return new Response("Missing storage id", { status: 400 });
    }
    
    const storageUrl = await ctx.storage.getUrl(storageId as Id<"_storage">);
    
    if (!storageUrl) {
      return new Response("File not found", { status: 404 });
    }
    
    return new Response(JSON.stringify({ url: storageUrl }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }),
});

authComponent.registerRoutes(http, createAuth, { cors: true });

export default http;