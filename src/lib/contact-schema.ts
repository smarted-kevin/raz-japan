import { z } from "zod";

export const CONTACT_TOPIC_VALUES = [
  "purchasing",
  "how_to_use",
  "technical",
  "other",
] as const;

export type ContactTopic = (typeof CONTACT_TOPIC_VALUES)[number];

export const CONTACT_MESSAGE_MAX = 4000;
export const CONTACT_NAME_MAX = 200;
export const CONTACT_EMAIL_MAX = 320;

const defaultMsgs = {
  required: "Required",
  email: "Invalid email address",
  emailMax: "Email is too long",
  nameMax: "Name is too long",
  messageMax: "Message is too long",
};

export function buildContactInquirySchema(messages: {
  required: string;
  email: string;
  emailMax: string;
  nameMax: string;
  messageMax: string;
}) {
  return z.object({
    topic: z.enum(CONTACT_TOPIC_VALUES),
    name: z
      .string()
      .trim()
      .min(1, messages.required)
      .max(CONTACT_NAME_MAX, messages.nameMax),
    email: z
      .string()
      .trim()
      .min(1, messages.required)
      .max(CONTACT_EMAIL_MAX, messages.emailMax)
      .email(messages.email),
    message: z
      .string()
      .trim()
      .min(1, messages.required)
      .max(CONTACT_MESSAGE_MAX, messages.messageMax),
  });
}

/** Server and shared validation (English fallbacks for API responses). */
export const contactInquirySchema = buildContactInquirySchema(defaultMsgs);

export type ContactInquiryInput = z.infer<typeof contactInquirySchema>;
