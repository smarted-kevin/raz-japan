import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import * as jsxRuntime from "react/jsx-runtime";
import ts from "typescript";

function load(path, imports) {
  const exports = {};
  const code = ts.transpileModule(
    readFileSync(new URL(path, import.meta.url), "utf8"),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        jsx: ts.JsxEmit.ReactJSX,
      },
    },
  ).outputText;
  runInNewContext(code, {
    exports,
    require: (name) => {
      assert.ok(name in imports, `Unexpected import: ${name}`);
      return imports[name];
    },
  });
  return exports;
}

const copy = JSON.parse(
  readFileSync(new URL("../messages/en.json", import.meta.url), "utf8"),
).billing;
function panel(issues) {
  const { BillingIssues } = load(
    "../src/components/billing/billingIssues.tsx",
    {
      "react/jsx-runtime": jsxRuntime,
      "convex/react": { useQuery: () => issues },
      "next-intl": {
        useTranslations:
          () =>
          (key, args = {}) => {
            assert.ok(key in copy, `Missing translation: ${key}`);
            return copy[key].replace("{count}", args.count);
          },
      },
      "next/link": { default: "a" },
      "@/convex/_generated/api": {
        api: { billingStore: { billingIssues: "issues" } },
      },
    },
  );
  return BillingIssues();
}
function elements(node) {
  if (Array.isArray(node)) return node.flatMap(elements);
  if (!node || typeof node !== "object" || !node.props) return [];
  return [node, ...elements(node.props.children)];
}
function text(node) {
  if (Array.isArray(node)) return node.map(text).join(" ");
  if (!node || typeof node === "boolean") return "";
  return typeof node === "object" ? text(node.props?.children) : String(node);
}
const empty = {
  courses: [],
  subscriptions: [],
  checkouts: [],
  activation_tasks_count: 0,
};

test("Attention panel has loading and clear empty states without redundant links", () => {
  assert.equal(panel(undefined).props.role, "status");
  const tree = panel(empty);
  assert.match(text(tree), /Needs attention/);
  assert.match(
    text(tree),
    /No pending platform changes or recorded billing issues/,
  );
  assert.equal(elements(tree).filter((node) => node.type === "a").length, 0);
  assert.equal(
    elements(tree).filter((node) => node.type === "details").length,
    0,
  );
});

test("Manual platform tasks link to the subscription queue and are not reported as empty", () => {
  const tree = panel({ ...empty, activation_tasks_count: 3 });
  const links = elements(tree).filter((node) => node.type === "a");
  assert.equal(links.length, 1);
  assert.equal(
    links[0].props.href,
    "/dashboard/admin/subscriptions?tasks=true",
  );
  assert.match(text(links[0]), /Pending platform changes: 3/);
  assert.doesNotMatch(text(tree), /No pending/);
});

test("Billing issues are compact and link to the relevant course, student and payer", () => {
  const tree = panel({
    ...empty,
    courses: [
      {
        _id: "pending-course",
        course_name: "Pending add-on",
        provisioning_state: "pending",
      },
      {
        _id: "failed-course",
        course_name: "Failed add-on",
        provisioning_state: "failed",
      },
    ],
    subscriptions: [
      {
        _id: "subscription",
        student_id: "student",
        stripe_subscription_id: "sub_stripe",
      },
    ],
    checkouts: [{ _id: "attempt", user_id: "payer" }],
  });
  const nodes = elements(tree);
  assert.equal(
    nodes.find((node) => node.type === "details").props.open,
    undefined,
  );
  assert.match(
    text(nodes.find((node) => node.type === "summary")),
    /Review billing issues \(4\)/,
  );
  assert.deepEqual(
    nodes.filter((node) => node.type === "a").map((node) => node.props.href),
    [
      "/dashboard/admin/courses/pending-course",
      "/dashboard/admin/courses/failed-course",
      "/dashboard/admin/subscriptions?student=student",
      "/dashboard/admin/users/payer",
    ],
  );
  assert.match(text(tree), /setup is still pending/);
  assert.match(text(tree), /Stripe setup needs attention/);
});

for (const role of ["admin", "god", "org_admin", "user", "no session"]) {
  test(`Old Billing Review bookmark redirects to admin home: ${role}`, async () => {
    const { default: page } = load(
      "../src/app/dashboard/admin/billing/page.tsx",
      {
        "convex/nextjs": {
          fetchQuery: async () => (role === "no session" ? null : { role }),
        },
        "next/navigation": {
          redirect: (path) => {
            throw new Error(`redirect:${path}`);
          },
        },
        "@/convex/_generated/api": {
          api: { auth: { getCurrentUser: "user" } },
        },
        "~/lib/auth-server": { getToken: async () => "token" },
      },
    );
    await assert.rejects(page(), /^Error: redirect:\/dashboard\/admin$/);
  });
}
