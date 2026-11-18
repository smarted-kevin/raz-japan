import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import * as jsxRuntime from "react/jsx-runtime";
import ts from "typescript";

const source = ts.transpileModule(
  readFileSync(new URL("../src/lib/analytics.ts", import.meta.url), "utf8"),
  {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  },
).outputText;
const sharedContext = {};
runInNewContext(
  ts.transpileModule(
    readFileSync(
      new URL("../src/lib/analytics-context.ts", import.meta.url),
      "utf8",
    ),
    { compilerOptions: { module: ts.ModuleKind.CommonJS } },
  ).outputText,
  { exports: sharedContext },
);

function harness({
  configured = true,
  blocked = false,
  failImport = false,
  importGate,
} = {}) {
  const entries = new Map();
  const location = {
    pathname: "/",
    search:
      "?utm_source=google&utm_medium=cpc&utm_campaign=unapproved&email=private@example.com",
  };
  const delivered = [];
  let config;
  let imports = 0;
  const storage = {
    getItem: (key) => {
      if (blocked) throw new Error("Storage blocked");
      return entries.get(key) ?? null;
    },
    setItem: (key, value) => {
      if (blocked) throw new Error("Storage blocked");
      entries.set(key, value);
    },
    removeItem: (key) => entries.delete(key),
  };
  const sdk = {
    init(_token, settings) {
      config = settings;
    },
    capture(event, properties, options) {
      const payload = config.before_send({
        event,
        uuid: randomUUID(),
        properties: {
          token: "phc_test",
          ...properties,
          $current_url: "https://site.test/reset-password?token=private",
          $referrer: "https://example.com/?email=private@example.com",
          $set: { email: "private@example.com" },
        },
        $set_once: { student: "private" },
      });
      if (payload)
        delivered.push({
          payload: JSON.parse(JSON.stringify(payload)),
          options,
        });
    },
  };
  function newTab() {
    const tab = {};
    runInNewContext(source, {
      exports: tab,
      process: {
        env: configured
          ? {
              NEXT_PUBLIC_POSTHOG_HOST: "https://eu.i.posthog.com",
              NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN: "phc_test",
            }
          : {},
      },
      window: { localStorage: storage, crypto: { randomUUID }, location },
      URL,
      URLSearchParams,
      setTimeout,
      clearTimeout,
      require: (name) => {
        if (name === "./analytics-context") return sharedContext;
        assert.equal(name, "posthog-js");
        imports++;
        if (failImport) throw new Error("Analytics blocked");
        if (importGate) return importGate.then(() => ({ default: sdk }));
        return { default: sdk };
      },
    });
    return tab;
  }
  return {
    analytics: newTab(),
    delivered,
    location,
    newTab,
    get imports() {
      return imports;
    },
  };
}

const landing = { name: "landing_page_viewed" };
const nextTurn = () => new Promise((resolve) => setImmediate(resolve));
const checkoutUrl = "https://checkout.stripe.com/c/pay/cs_test_private";

test("unset configuration, undecided, denied and blocked storage never load PostHog", async () => {
  for (const scenario of [
    { configured: false },
    { blocked: true },
    {},
    { declined: true },
  ]) {
    const state = harness(scenario);
    if (scenario.configured === false || scenario.blocked) {
      state.analytics.rememberAnalyticsConsent("allowed");
    } else if (scenario.declined) {
      state.analytics.rememberAnalyticsConsent("declined");
    }
    state.analytics.prepareAnalytics();
    state.analytics.captureAnalytics(landing, "en");
    await nextTurn();
    assert.equal(state.imports, 0);
    assert.equal(state.delivered.length, 0);
  }
});

test("only approved properties reach PostHog and the ID follows a browser across funnel steps", async () => {
  const { analytics, delivered, location, newTab } = harness();
  analytics.rememberAnalyticsConsent("allowed");
  analytics.captureAnalytics(landing, "ja");
  analytics.captureAnalytics({ name: "get_started_clicked" }, "ja");
  await nextTurn();
  const secondTab = newTab();
  location.pathname = "/sign-up";
  location.search = "?utm_source=unknown";
  secondTab.captureAnalytics({ name: "signup_completed" }, "ja");
  await nextTurn();
  const [first, second, signup] = delivered.map(({ payload }) => payload);
  const { properties } = first;
  assert.deepEqual(
    [first.event, second.event, signup.event],
    ["landing_page_viewed", "get_started_clicked", "signup_completed"],
  );
  assert.deepEqual(properties, {
    token: "phc_test",
    distinct_id: properties.distinct_id,
    $process_person_profile: false,
    $geoip_disable: true,
    locale: "ja",
    utm_source: "google",
    utm_medium: "cpc",
    page: "landing",
  });
  assert.equal(signup.properties.distinct_id, properties.distinct_id);
  assert.equal(signup.properties.page, "signup");
  assert.equal(first.$set_once, undefined);
  assert.ok(
    delivered.every(({ options }) => options.transport === "sendBeacon"),
  );
});

test("withdrawal clears identity and campaign across tabs and drops a pending event", async () => {
  const { analytics, delivered, location, newTab } = harness();
  analytics.rememberAnalyticsConsent("allowed");
  analytics.captureAnalytics(landing, "en");
  await nextTurn();
  const oldId = delivered[0].payload.properties.distinct_id;
  const secondTab = newTab();
  secondTab.captureAnalytics(landing, "en");
  analytics.rememberAnalyticsConsent("declined");
  await nextTurn();
  assert.equal(delivered.length, 1);
  assert.equal(secondTab.readAnalyticsConsent(), "declined");

  location.search = "";
  analytics.rememberAnalyticsConsent("allowed");
  secondTab.captureAnalytics(landing, "en");
  await nextTurn();
  const newProperties = delivered[1].payload.properties;
  assert.notEqual(newProperties.distinct_id, oldId);
  assert.equal(newProperties.utm_source, undefined);
  analytics.resetAnalyticsIdentity();
  secondTab.captureAnalytics(landing, "en");
  assert.notEqual(
    delivered[2].payload.properties.distinct_id,
    newProperties.distinct_id,
  );
});

test("only the respective member routes and an actual Stripe Checkout URL qualify", async () => {
  const { analytics, delivered, location } = harness();
  analytics.rememberAnalyticsConsent("allowed");
  location.pathname = "/dashboard/members/order";
  for (const url of [
    "",
    "http://checkout.stripe.com/a",
    "https://checkout.stripe.com.evil.test/a",
  ]) {
    analytics.captureCheckoutStarted(url, "annual", "en");
  }
  analytics.captureCheckoutStarted(checkoutUrl, "annual", "en");
  analytics.captureCheckoutStarted(checkoutUrl, "monthly", "en");
  await nextTurn();
  location.pathname = "/dashboard/members/subscriptions/add";
  analytics.captureCheckoutStarted(checkoutUrl, "monthly", "ja");
  for (const path of [
    "/dashboard/admin",
    "/reset-password",
    "/dashboard/members/checkout/success",
  ]) {
    location.pathname = path;
    analytics.captureCheckoutStarted(checkoutUrl, "annual", "en");
    analytics.captureAnalytics({ name: "signup_completed" }, "en");
  }
  assert.deepEqual(
    delivered.map(({ payload }) => [
      payload.event,
      payload.properties.checkout_type,
      payload.properties.locale,
    ]),
    [
      ["checkout_started", "annual", "en"],
      ["checkout_started", "monthly", "ja"],
    ],
  );
  assert.ok(!JSON.stringify(delivered).includes("cs_test_private"));
});

test("SDK failures do not interrupt checkout", async () => {
  const { analytics, location, delivered } = harness({ failImport: true });
  analytics.rememberAnalyticsConsent("allowed");
  location.pathname = "/dashboard/members/order";
  assert.doesNotThrow(() =>
    analytics.captureCheckoutStarted(checkoutUrl, "annual", "en"),
  );
  await nextTurn();
  assert.equal(delivered.length, 0);
});

test("checkout waits for a cold SDK before redirecting and bounds a blocked import", async () => {
  let release;
  const importGate = new Promise((resolve) => {
    release = resolve;
  });
  const { analytics, delivered, location } = harness({ importGate });
  analytics.rememberAnalyticsConsent("allowed");
  location.pathname = "/dashboard/members/subscriptions/add";
  let redirected = false;
  const checkout = analytics
    .captureCheckoutStarted(checkoutUrl, "monthly", "ja")
    .then(() => {
      redirected = true;
    });
  await nextTurn();
  assert.equal(redirected, false);
  release();
  await checkout;
  assert.equal(delivered[0].payload.event, "checkout_started");
  assert.equal(delivered[0].payload.properties.locale, "ja");
  assert.equal(redirected, true);

  const blocked = harness({ importGate: new Promise(() => {}) });
  blocked.analytics.rememberAnalyticsConsent("allowed");
  blocked.location.pathname = "/dashboard/members/subscriptions/add";
  await blocked.analytics.captureCheckoutStarted(checkoutUrl, "monthly", "ja");
  assert.equal(blocked.delivered.length, 0);
});

test("checkout attribution follows consent and carries the same browser ID without raw URLs", async () => {
  const { analytics, delivered, location } = harness();
  assert.equal(analytics.checkoutAnalyticsContext("en"), undefined);
  analytics.rememberAnalyticsConsent("allowed");
  analytics.captureAnalytics(landing, "en");
  await nextTurn();
  location.pathname = "/dashboard/members/order";
  assert.deepEqual(
    JSON.parse(JSON.stringify(analytics.checkoutAnalyticsContext("en"))),
    {
      project_token: "phc_test",
      distinct_id: delivered[0].payload.properties.distinct_id,
      locale: "en",
      utm_source: "google",
      utm_medium: "cpc",
    },
  );
  analytics.rememberAnalyticsConsent("declined");
  assert.equal(analytics.checkoutAnalyticsContext("en"), undefined);
});

test("the signup form captures only Better Auth success and continues to the dashboard", async () => {
  const signupSource = ts.transpileModule(
    readFileSync(
      new URL("../src/app/(auth)/sign-up/SignUp.tsx", import.meta.url),
      "utf8",
    ),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        jsx: ts.JsxEmit.ReactJSX,
      },
    },
  ).outputText;
  const { analytics, delivered, location } = harness();
  location.pathname = "/sign-up";
  analytics.rememberAnalyticsConsent("allowed");
  const exports = {};
  const redirects = [];
  let succeeds = false;
  const Button = () => null;
  const imports = {
    "react/jsx-runtime": jsxRuntime,
    react: { useState: (value) => [value, () => {}] },
    "next/navigation": {
      useRouter: () => ({ push: (url) => redirects.push(url) }),
    },
    "next-intl": { useLocale: () => "ja" },
    "~/lib/analytics": analytics,
    "~/lib/auth-client": {
      authClient: {
        signUp: {
          email: async (_input, callbacks) => {
            if (succeeds) callbacks.onSuccess();
            else callbacks.onError({ error: { message: "Rejected" } });
          },
        },
      },
    },
    "~/components/ui/button": { Button },
    "~/components/ui/card": {
      Card: "div",
      CardContent: "div",
      CardDescription: "p",
      CardHeader: "header",
      CardTitle: "h2",
    },
    "~/components/ui/input": { Input: "input" },
    "~/components/ui/label": { Label: "label" },
    "~/lib/public-cta-styles": {},
    "~/lib/utils": { cn: () => "" },
    sonner: { toast: { success: () => {}, error: () => {} } },
    "lucide-react": {},
  };
  runInNewContext(signupSource, {
    exports,
    require: (name) => imports[name],
    console: { error: () => {} },
  });
  function submitButton(element) {
    if (element?.type === Button) return element;
    const children = element?.props?.children;
    return (Array.isArray(children) ? children : [children])
      .filter(Boolean)
      .map(submitButton)
      .find(Boolean);
  }
  const submit = submitButton(exports.default()).props.onClick;
  await submit();
  await nextTurn();
  assert.equal(delivered.length, 0);
  assert.deepEqual(redirects, []);
  succeeds = true;
  await submit();
  await nextTurn();
  assert.deepEqual(
    delivered.map(({ payload }) => payload.event),
    ["signup_completed"],
  );
  assert.deepEqual(redirects, ["/dashboard/"]);
});
