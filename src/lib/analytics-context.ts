// Add campaign slugs here before publishing links that use them.
const approvedCampaignValues = {
  utm_source: ["google", "bing", "facebook", "instagram", "line", "newsletter"],
  utm_medium: ["cpc", "email", "social", "referral", "qr", "organic"],
  utm_campaign: [],
} satisfies Record<string, readonly string[]>;

const campaignKeys = ["utm_source", "utm_medium", "utm_campaign"] as const;
type Campaign = Partial<Record<(typeof campaignKeys)[number], string>>;

export const analyticsVisitorId =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function approvedCampaign(
  read: (key: keyof Campaign) => unknown,
): Campaign {
  const campaign: Campaign = {};
  for (const key of campaignKeys) {
    const value = read(key);
    const allowed: readonly string[] = approvedCampaignValues[key];
    if (typeof value === "string" && allowed.includes(value))
      campaign[key] = value;
  }
  return campaign;
}
