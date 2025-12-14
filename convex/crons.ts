import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

/**
 * Daily cron job to send renewal notice emails
 * Runs at 5pm Japan time (8am UTC)
 * Sends emails to users with students expiring in 1 month
 */
crons.daily(
  "send-renewal-notices",
  {
    hourUTC: 8, // 5pm JST = 8am UTC (Japan is UTC+9)
    minuteUTC: 0,
  },
  internal.email.sendRenewalNoticeEmails,
);

export default crons;
