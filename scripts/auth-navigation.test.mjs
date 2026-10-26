import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import * as jsxRuntime from "react/jsx-runtime";
import ts from "typescript";

function loadLayout(path, imports) {
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
      if (name === "react/jsx-runtime") return jsxRuntime;
      if (!(name in imports)) throw new Error(`Unexpected import: ${name}`);
      return imports[name];
    },
  });
  return exports.default;
}

test("route layouts leave shared Convex authentication owned by the root", () => {
  const appDirectory = new URL("../src/app/", import.meta.url);
  const authLayouts = [];
  function visit(directory) {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const path = new URL(entry.name, directory);
      if (entry.isDirectory()) visit(new URL(`${entry.name}/`, directory));
      else if (entry.name === "layout.tsx") {
        const source = readFileSync(path, "utf8");
        if (
          /ConvexClientProvider|ConvexBetterAuthProvider|ConvexProviderWithAuth|ConvexAuthNextjsServerProvider/.test(
            source,
          )
        ) {
          authLayouts.push(path.href);
        }
      }
    }
  }
  visit(appDirectory);
  // Unmounting a second auth provider would clear the singleton client's auth
  // while the persistent root and public navigation are still using it.
  assert.deepEqual(authLayouts, [new URL("layout.tsx", appDirectory).href]);
});

for (const scenario of [
  { name: "signed out", token: undefined, user: null, destination: "/sign-in" },
  {
    name: "expired session",
    token: "token",
    user: null,
    destination: "/sign-in",
  },
  ...["admin", "org_admin", "god"].map((role) => ({
    name: role,
    token: "token",
    user: { role },
    destination: "/dashboard/admin",
  })),
  { name: "member", token: "token", user: { role: "user" } },
]) {
  test(`member route retains its server auth guard: ${scenario.name}`, async () => {
    const calls = [];
    const layout = loadLayout("../src/app/dashboard/members/layout.tsx", {
      "next-intl": { NextIntlClientProvider: "intl-provider" },
      "~/components/ui/nav/publicNavBar": { PublicNavBar: "public-nav" },
      "next/navigation": {
        redirect: (path) => {
          throw new Error(`redirect:${path}`);
        },
      },
      "~/lib/auth-server": { getToken: async () => scenario.token },
      "convex/nextjs": {
        fetchQuery: async (_query, _args, options) => {
          calls.push(options);
          assert.equal(options.token, "token");
          return scenario.user;
        },
      },
      "@/convex/_generated/api": {
        api: { auth: { getCurrentUser: "current-user" } },
      },
    });
    if (scenario.destination) {
      await assert.rejects(
        layout({ children: "protected-content" }),
        (error) => error.message === `redirect:${scenario.destination}`,
      );
    } else {
      const tree = await layout({ children: "protected-content" });
      assert.equal(
        tree.props.children.props.children[1].props.children,
        "protected-content",
      );
    }
    assert.equal(calls.length, scenario.token ? 1 : 0);
  });
}

test("locale layout renders public content without requiring a session", async () => {
  const layout = loadLayout("../src/app/[locale]/layout.tsx", {
    "next-intl": {
      NextIntlClientProvider: "intl-provider",
      hasLocale: (locales, locale) => locales.includes(locale),
    },
    "next/navigation": {
      notFound: () => {
        throw new Error("not-found");
      },
    },
    "~/i18n/routing.public": { routing: { locales: ["en", "ja"] } },
  });
  for (const locale of ["en", "ja"]) {
    const tree = await layout({
      children: "public-content",
      params: Promise.resolve({ locale }),
    });
    assert.equal(tree.props.locale, locale);
    assert.equal(tree.props.children, "public-content");
  }
  await assert.rejects(
    layout({
      children: "public-content",
      params: Promise.resolve({ locale: "invalid" }),
    }),
    /not-found/,
  );
});
