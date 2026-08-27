import { Resend } from "resend";
import { createHmac } from "node:crypto";
import { fetchMutation } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { contactInquirySchema } from "~/lib/contact-schema";
import type { ContactTopic } from "~/lib/contact-schema";

const TOPIC_LABEL_EN: Record<ContactTopic, string> = {
  purchasing: "Purchasing",
  how_to_use: "How to Use",
  technical: "Technical issues",
  other: "Other",
};

const resend = new Resend(process.env.RESEND_API_KEY);
const MAX_BODY_BYTES = 16 * 1024;

function json(body: object, init?: ResponseInit) {
  const headers = new Headers(init?.headers);
  headers.set("Cache-Control", "no-store");
  return Response.json(body, { ...init, headers });
}

function getClientAddress(request: Request): string {
  const headers = request.headers;
  const forwarded =
    headers.get("cf-connecting-ip") ??
    headers.get("x-vercel-forwarded-for") ??
    headers.get("x-real-ip") ??
    headers.get("x-forwarded-for") ??
    "unknown";
  return forwarded.split(",")[0]?.trim() || "unknown";
}

function keyedHash(secret: string, value: string): string {
  return createHmac("sha256", secret).update(value).digest("hex");
}

export async function POST(request: Request) {
  const to = process.env.CONTACT_INQUIRY_TO_EMAIL;
  if (!to?.trim()) {
    console.error("CONTACT_INQUIRY_TO_EMAIL is not configured");
    return json({ error: "Service unavailable" }, { status: 503 });
  }

  const rateLimitSecret = process.env.CONTACT_RATE_LIMIT_SECRET;
  if (!rateLimitSecret) {
    console.error("CONTACT_RATE_LIMIT_SECRET is not configured");
    return json({ error: "Service unavailable" }, { status: 503 });
  }

  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
    return json({ error: "Request too large" }, { status: 413 });
  }

  let body: unknown;
  try {
    const rawBody = await request.text();
    if (Buffer.byteLength(rawBody, "utf8") > MAX_BODY_BYTES) {
      return json({ error: "Request too large" }, { status: 413 });
    }
    body = JSON.parse(rawBody) as unknown;
  } catch {
    return json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = contactInquirySchema.safeParse(body);
  if (!parsed.success) {
    return json({ error: "Validation failed" }, { status: 400 });
  }

  if (parsed.data.website?.trim()) {
    return json({ ok: true });
  }

  let rateLimit;
  try {
    rateLimit = await fetchMutation(
      api.mutations.contact.consumeContactRateLimit,
      {
        secret: rateLimitSecret,
        ip_key: keyedHash(rateLimitSecret, getClientAddress(request)),
        email_key: keyedHash(rateLimitSecret, parsed.data.email.toLowerCase()),
      },
    );
  } catch (error) {
    console.error("Contact rate limiter unavailable:", error);
    return json({ error: "Service unavailable" }, { status: 503 });
  }

  if (!rateLimit.ok) {
    return json(
      { error: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: { "Retry-After": String(rateLimit.retry_after_seconds) },
      },
    );
  }

  const { topic, name, email, message } = parsed.data;
  const topicLabel = TOPIC_LABEL_EN[topic];

  const text = [
    `Topic: ${topicLabel}`,
    `Name: ${name}`,
    `Email: ${email}`,
    "",
    "Message:",
    message,
  ].join("\n");

  try {
    const { error } = await resend.emails.send({
      from:
        process.env.RESEND_FROM_EMAIL ??
        "Raz-Japan <onboarding@resend.dev>",
      to: [to.trim()],
      replyTo: email,
      subject: `[Raz-Japan] Contact: ${topicLabel}`,
      text,
    });

    if (error) {
      console.error("Resend error:", error);
      return json({ error: "Failed to send message" }, { status: 500 });
    }

    return json({ ok: true });
  } catch (err) {
    console.error("Contact API error:", err);
    return json({ error: "Failed to send message" }, { status: 500 });
  }
}
