import { Resend } from "resend";
import { contactInquirySchema } from "~/lib/contact-schema";
import type { ContactTopic } from "~/lib/contact-schema";

const TOPIC_LABEL_EN: Record<ContactTopic, string> = {
  purchasing: "Purchasing",
  how_to_use: "How to Use",
  technical: "Technical issues",
  other: "Other",
};

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  const to = process.env.CONTACT_INQUIRY_TO_EMAIL;
  if (!to?.trim()) {
    console.error("CONTACT_INQUIRY_TO_EMAIL is not configured");
    return Response.json({ error: "Service unavailable" }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = contactInquirySchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Validation failed" }, { status: 400 });
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
      return Response.json({ error: "Failed to send message" }, { status: 500 });
    }

    return Response.json({ ok: true });
  } catch (err) {
    console.error("Contact API error:", err);
    return Response.json({ error: "Failed to send message" }, { status: 500 });
  }
}
