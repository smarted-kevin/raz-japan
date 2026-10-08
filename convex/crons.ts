import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.interval(
  "expire-monthly-access",
  { minutes: 15 },
  internal.billingStore.expireAccess,
);
crons.interval(
  "reconcile-monthly-billing",
  { hours: 1 },
  internal.subscriptions.reconcile,
);

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

crons.interval(
  "cleanup-contact-rate-limits",
  { hours: 6 },
  internal.mutations.contact.cleanupContactRateLimits,
);

export default crons;
