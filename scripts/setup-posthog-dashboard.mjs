const projectHost =
  process.env.POSTHOG_REGION === "us"
    ? "https://us.posthog.com"
    : "https://eu.posthog.com";
if (
  process.env.POSTHOG_REGION &&
  !["eu", "us"].includes(process.env.POSTHOG_REGION)
) {
  throw new Error("POSTHOG_REGION must be eu or us.");
}
const dashboard = {
  name: "RAZ Japan | Opted-in browser activity",
  description:
    "Activity from opted-in browsers over the last 30 days. Funnels allow 7 days to convert. Checkout starts record Stripe redirects.",
};
const dateRange = { date_from: "-30d" };
const event = (name) => ({ kind: "EventsNode", event: name });
const steps = [
  "landing_page_viewed",
  "get_started_clicked",
  "signup_completed",
  "checkout_started",
];
const breakdownFilter = (property) => ({
  breakdown: property,
  breakdown_type: "event",
});
const funnelFor = (events, breakdown) => ({
  kind: "FunnelsQuery",
  dateRange,
  series: events.map(event),
  funnelsFilter: { funnelWindowInterval: 7, funnelWindowIntervalUnit: "day" },
  ...(breakdown ? { breakdownFilter: breakdownFilter(breakdown) } : {}),
});
const funnel = (length, breakdown) =>
  funnelFor(steps.slice(0, length), breakdown);
const insights = [
  ["Landing to checkout", funnel(4)],
  ["Landing to signup", funnel(3)],
  ["Landing to checkout by language", funnel(4, "locale")],
  ["Landing to checkout by campaign source", funnel(4, "utm_source")],
  ["Landing to checkout by campaign", funnel(4, "utm_campaign")],
  ["Landing to confirmed payment", funnelFor([...steps, "payment_confirmed"])],
  [
    "Checkout to confirmed payment by type",
    funnelFor(["checkout_started", "payment_confirmed"], "checkout_type"),
  ],
  [
    "Checkout starts by type",
    {
      kind: "TrendsQuery",
      dateRange,
      series: [event("checkout_started")],
      breakdownFilter: breakdownFilter("checkout_type"),
    },
  ],
].map(([name, source]) => ({
  name,
  query: { kind: "InsightVizNode", source },
}));

if (process.argv[2] === "--dry-run") {
  console.log(JSON.stringify({ dashboard, insights }, null, 2));
} else {
  const projectId = process.env.POSTHOG_PROJECT_ID;
  const key = process.env.POSTHOG_PERSONAL_API_KEY;
  if (!/^[1-9]\d*$/.test(projectId ?? "") || !key?.startsWith("phx_")) {
    throw new Error(
      "Set POSTHOG_PROJECT_ID and POSTHOG_PERSONAL_API_KEY in your shell, or use --dry-run.",
    );
  }
  const base = `${projectHost}/api/projects/${projectId}/`;
  async function request(path, body) {
    const response = await fetch(base + path, {
      method: body ? "POST" : "GET",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
      redirect: "error",
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok)
      throw new Error(`PostHog ${path} returned HTTP ${response.status}.`);
    return response.json();
  }
  const matches = await request(
    `dashboards/?search=${encodeURIComponent(dashboard.name)}`,
  );
  const existing = matches.results.filter(
    (item) => !item.deleted && item.name === dashboard.name,
  );
  if (existing.length > 1 || (existing.length === 0 && matches.next)) {
    throw new Error(
      "Could not resolve a unique dashboard. Check the matching dashboard names in PostHog.",
    );
  }
  const { id } = existing[0] ?? (await request("dashboards/", dashboard));
  const saved = await request(
    `insights/?dashboards=${id}&basic=true&limit=100`,
  );
  if (saved.next)
    throw new Error("Too many existing insights to provision safely.");
  for (const insight of insights) {
    if (
      saved.results.some((item) => !item.deleted && item.name === insight.name)
    )
      continue;
    await request("insights/", { ...insight, dashboards: [id] });
  }
  console.log(`${projectHost}/project/${projectId}/dashboard/${id}`);
}
