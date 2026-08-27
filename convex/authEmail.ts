"use node";

import { internalAction } from "./_generated/server";
import { v } from "convex/values";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendAuthEmail = internalAction({
  args: {
    kind: v.literal("password_reset"),
    email: v.string(),
    name: v.string(),
    url: v.string(),
  },
  handler: async (_ctx, args) => {
    const from = process.env.RESEND_FROM_EMAIL ?? "Raz-Japan <onboarding@resend.dev>";

    const subject = "Reset your Raz-Japan password";
    const action = "reset your password";
    const expiry = "30 minutes";
    const greeting = args.name.trim() ? `Hello ${args.name.trim()},` : "Hello,";

    const { error } = await resend.emails.send({
      from,
      to: args.email,
      subject,
      text: [
        greeting,
        "",
        `Use the link below to ${action}:`,
        args.url,
        "",
        `This link expires in ${expiry}. If you did not request this, you can ignore this email.`,
      ].join("\n"),
    });

    if (error) {
      throw new Error(`Failed to send authentication email: ${error.message}`);
    }

    return { success: true };
  },
});
