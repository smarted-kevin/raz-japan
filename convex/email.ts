"use node";

import { internalAction } from "./_generated/server";
import { v } from "convex/values";
import { Resend } from "resend";
import { render } from "@react-email/render";
import { PaymentConfirmationEmail } from "../src/components/payment-confirmation-email";
import { RenewalNoticeEmail } from "../src/components/renewal-notice-email";
import { api, internal } from "./_generated/api";

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Sends a payment confirmation email to the user
 */
export const sendPaymentConfirmationEmail = internalAction({
  args: {
    userId: v.id("userTable"),
    orderId: v.string(),
    totalAmount: v.number(),
    stripeOrderId: v.optional(v.string()),
  },
  handler: async (ctx, { userId, orderId, totalAmount, stripeOrderId }) => {
    try {
      // Get user information
      const user = await ctx.runQuery(api.queries.users.getUserById, {
        id: userId,
      });

      if (!user?.email) {
        console.error("User not found or email missing");
        return { success: false, error: "User not found or email missing" };
      }

      // Format order date
      const orderDate = new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      // Render the email template
      const emailHtml = await render(
        PaymentConfirmationEmail({
          firstName: user.first_name ?? "Valued Customer",
          orderId: stripeOrderId ?? String(orderId),
          totalAmount: totalAmount,
          currency: "JPY",
          orderDate: orderDate,
        })
      );

      // Send email using Resend
      const { data, error } = await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL ?? "Raz-Japan <onboarding@resend.dev>",
        to: user.email,
        subject: "Payment Confirmed - Raz-Japan",
        html: emailHtml,
      });

      if (error) {
        console.error("Error sending email:", error);
        return { success: false, error: error.message || "Failed to send email" };
      }

      console.log("Payment confirmation email sent successfully:", data);
      return { success: true, data };
    } catch (err) {
      console.error("Exception sending payment confirmation email:", err);
      return {
        success: false,
        error: (err as { message: string }).message || "Unknown error",
      };
    }
  },
});

/**
 * Sends renewal notice emails to users with students expiring in 1 month
 */
export const sendRenewalNoticeEmails = internalAction({
  args: {},
  handler: async (ctx) => {
    try {
      // Get all users with students expiring in 1 month
      const usersWithExpiringStudents = await ctx.runQuery(
        internal.queries.student.getStudentsExpiringInOneMonth
      ) as Array<{
        userId: string;
        userEmail: string;
        userFirstName: string;
        userLastName: string;
        expiringStudents: Array<{
          username: string;
          expiryDate: number | undefined;
          courseName?: string;
          coursePrice?: number;
        }>;
      }>;

      if (!usersWithExpiringStudents || usersWithExpiringStudents.length === 0) {
        console.log("No students expiring in 1 month");
        return { success: true, emailsSent: 0 };
      }

      let emailsSent = 0;
      const errors: string[] = [];

      // Send email to each user
      for (const userData of usersWithExpiringStudents) {
        try {
          if (!userData.userEmail) {
            console.error(`User ${userData.userId} has no email address`);
            errors.push(`User ${userData.userId}: No email address`);
            continue;
          }

          // Format expiring students data for email, filtering out any without expiry dates
          const expiringStudentsData = userData.expiringStudents
            .filter((student) => student.expiryDate !== undefined)
            .map((student) => ({
              username: student.username,
              expiryDate: student.expiryDate!,
              courseName: student.courseName,
              coursePrice: student.coursePrice,
            }));

          if (expiringStudentsData.length === 0) {
            continue;
          }

          // Render the email template
          const emailHtml = await render(
            RenewalNoticeEmail({
              firstName: userData.userFirstName,
              expiringStudents: expiringStudentsData,
            })
          );

          // Send email using Resend
          const { error } = await resend.emails.send({
            from: process.env.RESEND_FROM_EMAIL ?? "Raz-Japan <onboarding@resend.dev>",
            to: userData.userEmail,
            subject: `Renewal Notice - ${expiringStudentsData.length} Student${expiringStudentsData.length > 1 ? 's' : ''} Expiring Soon`,
            html: emailHtml,
          });

          if (error) {
            console.error(`Error sending renewal email to ${userData.userEmail}:`, error);
            errors.push(`${userData.userEmail}: ${error.message || "Failed to send email"}`);
            continue;
          }

          console.log(`Renewal notice sent to ${userData.userEmail} for ${expiringStudentsData.length} student(s)`);
          emailsSent++;
        } catch (err) {
          const errorMessage = (err as { message?: string }).message ?? "Unknown error";
          console.error(`Exception sending renewal email to ${userData.userEmail}:`, err);
          errors.push(`${userData.userEmail}: ${errorMessage}`);
        }
      }

      return {
        success: errors.length === 0,
        emailsSent,
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (err) {
      console.error("Exception in sendRenewalNoticeEmails:", err);
      return {
        success: false,
        error: (err as { message?: string }).message ?? "Unknown error",
      };
    }
  },
});

