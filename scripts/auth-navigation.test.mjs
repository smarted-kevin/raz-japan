import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import * as jsxRuntime from "react/jsx-runtime";
import * as React from "react";
import { act, create } from "react-test-renderer";
import * as convexReact from "convex/react";
import { ConvexBetterAuthProvider } from "@convex-dev/better-auth/react";
import ts from "typescript";

function loadModule(path, imports) {
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
    process: { env: { NEXT_PUBLIC_CONVEX_URL: "https://test.convex.cloud" } },
    require: (name) => {
      if (name === "react/jsx-runtime") return jsxRuntime;
      if (!(name in imports)) throw new Error(`Unexpected import: ${name}`);
      return imports[name];
    },
  });
  return exports;
}

function loadLayout(path, imports) {
  return loadModule(path, imports).default;
}

// Keep React, Better Auth, and Convex's provider/hooks real. Only replace the
// network transport and session source so this runs without a deployed backend.
class AuthenticatedTransport {
  token = null;
  listeners = new Set();
  revision = 0;

  async setAuth(fetchToken, onChange) {
    this.token = await fetchToken({ forceRefreshToken: true });
    onChange(this.token === "member-token");
    this.publish();
  }

  clearAuth() {
    this.token = null;
    this.publish();
  }

  publish() {
    for (const listener of this.listeners) listener();
  }

  watchQuery() {
    return {
      onUpdate: (listener) => {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
      },
      // A fresh result depends on the current token, never a cached session.
      localQueryResult: () =>
        this.token === "member-token"
          ? { name: "Member", role: "user", revision: this.revision }
          : null,
    };
  }
}

for (const nestedProvider of [false, true]) {
  test(
    nestedProvider
      ? "navigation harness detects auth cleared by a child provider's unmount"
      : "authenticated queries survive leaving the member route",
    async (t) => {
      const previousWindow = globalThis.window;
      const previousActEnvironment = globalThis.IS_REACT_ACT_ENVIRONMENT;
      globalThis.window = { location: { href: "https://example.test/en" } };
      globalThis.IS_REACT_ACT_ENVIRONMENT = true;
      t.after(() => {
        if (previousWindow === undefined) delete globalThis.window;
        else globalThis.window = previousWindow;
        if (previousActEnvironment === undefined)
          delete globalThis.IS_REACT_ACT_ENVIRONMENT;
        else globalThis.IS_REACT_ACT_ENVIRONMENT = previousActEnvironment;
      });

      const client = new AuthenticatedTransport();
      const session = { user: { id: "member", role: "user" } };
      const authClient = {
        useSession: () => ({ data: session, isPending: false }),
        convex: { token: async () => ({ data: { token: "member-token" } }) },
      };
      const { ConvexClientProvider } = loadModule(
        "../src/app/ConvexClientProvider.tsx",
        {
          react: React,
          "convex/react": {
            ...convexReact,
            ConvexReactClient: class {
              constructor() {
                return client;
              }
            },
          },
          "~/lib/auth-client": { authClient },
          "@convex-dev/better-auth/react": { ConvexBetterAuthProvider },
        },
      );
      const passthrough = ({ children }) => children;
      const intl = {
        NextIntlClientProvider: passthrough,
        useTranslations: () => (key) => key,
      };
      const api = {
        auth: { getCurrentUser: "auth:getCurrentUser" },
        queries: {
          users: { getUserRoleByAuthId: "queries/users:getUserRoleByAuthId" },
        },
      };
      const redirect = (path) => {
        throw new Error(path);
      };
      const primitives = new Proxy({}, { get: () => passthrough });
      // Mount the real navigation descendants too: a provider introduced in a
      // child must participate in cleanup when the member layout disappears.
      const navImports = {
        react: React,
        "convex/react": convexReact,
        "@convex-dev/better-auth/react": { ConvexBetterAuthProvider },
        "~/app/ConvexClientProvider": { ConvexClientProvider },
        "~/lib/auth-client": { authClient },
        "@/convex/_generated/api": { api },
        "next-intl": intl,
        "next/navigation": { redirect },
        "next/link": {
          default: ({ children, ...props }) =>
            jsxRuntime.jsx("a", { ...props, children }),
        },
        "next/image": { default: () => null },
        "lucide-react": primitives,
        "~/lib/utils": {
          cn: (...classes) => classes.filter(Boolean).join(" "),
        },
        "~/lib/public-layout": { publicSiteContainerClassName: "" },
        "~/lib/public-cta-styles": {},
        "~/lib/member-signup": { isMemberSignupEnabled: () => true },
        "~/lib/landing-images": {
          LANDING_IMAGES: { razPlusLogo: "/logo.png" },
        },
        "~/components/ui/button": {
          Button: passthrough,
          buttonVariants: () => "",
        },
        "../button": { Button: passthrough },
        "~/components/ui/sheet": primitives,
        "~/components/ui/dropdown-menu": primitives,
        "../auth/signOut": { SignOutButton: () => null },
        "~/components/ui/auth/signOut": { SignOutButton: () => null },
        "./publicLocaleSwitcher": { PublicLocaleSwitcher: () => null },
      };
      const navModule = (name) =>
        loadModule(`../src/components/ui/nav/${name}.tsx`, navImports);
      navImports["./userDropdown"] = navModule("userDropdown");
      navImports["./publicNavLinks"] = navModule("publicNavLinks");
      navImports["./mobileNavMenu"] = navModule("mobileNavMenu");
      const { PublicNavBar } = navModule("publicNavBar");
      let mounts = 0;
      let unmounts = 0;
      function QueryProbe({ id }) {
        const result = convexReact.useQuery("auth:getCurrentUser");
        return jsxRuntime.jsx("output", {
          id,
          children: result ? `${result.name}:${result.revision}` : "signed out",
        });
      }
      function MemberContent() {
        React.useEffect(() => {
          mounts++;
          return () => {
            unmounts++;
          };
        }, []);
        const query = jsxRuntime.jsx(QueryProbe, { id: "member-query" });
        return nestedProvider
          ? jsxRuntime.jsx(ConvexClientProvider, { children: query })
          : query;
      }
      const rootLayout = loadLayout("../src/app/layout.tsx", {
        "~/styles/globals.css": {},
        "~/app/ConvexClientProvider": { ConvexClientProvider },
        "next/headers": {
          headers: async () => new Map([["x-pathname", "/contact"]]),
        },
        "next-intl": intl,
        "next-intl/server": { getLocale: async () => "en" },
        "~/lib/get-session": {
          getServerSession: async () => ({ user: session.user }),
        },
        "next/navigation": {
          redirect: (path) => {
            throw new Error(path);
          },
        },
        sonner: { Toaster: () => null },
      });
      const memberLayout = loadLayout(
        "../src/app/dashboard/members/layout.tsx",
        {
          "next-intl": intl,
          "~/components/ui/nav/publicNavBar": { PublicNavBar },
          "next/navigation": {
            redirect: (path) => {
              throw new Error(path);
            },
          },
          "~/lib/auth-server": { getToken: async () => "member-token" },
          "convex/nextjs": { fetchQuery: async () => session.user },
          "@/convex/_generated/api": {
            api: { auth: { getCurrentUser: "auth:getCurrentUser" } },
          },
        },
      );
      const localeLayout = loadLayout("../src/app/[locale]/layout.tsx", {
        "next-intl": { ...intl, hasLocale: () => true },
        "next/navigation": {
          notFound: () => {
            throw new Error("not found");
          },
        },
        "~/i18n/routing.public": { routing: { locales: ["en", "ja"] } },
      });
      // This sibling stays mounted like public navigation across route changes.
      const persistentQuery = jsxRuntime.jsx(QueryProbe, {
        id: "persistent-query",
      });
      const publicTree = await localeLayout({
        children: jsxRuntime.jsx(QueryProbe, { id: "public-query" }),
        params: Promise.resolve({ locale: "en" }),
      });
      const memberTree = await memberLayout({
        children: jsxRuntime.jsx(MemberContent, {}),
      });
      let navigate;
      function RouteSlot() {
        const [route, setRoute] = React.useState(publicTree);
        navigate = setRoute;
        return route;
      }
      const rootTree = await rootLayout({
        children: jsxRuntime.jsxs(React.Fragment, {
          children: [
            jsxRuntime.jsx(PublicNavBar, {}),
            persistentQuery,
            jsxRuntime.jsx(RouteSlot, {}),
          ],
        }),
      });
      let renderer;
      try {
        await act(async () => {
          renderer = create(rootTree);
        });
        const output = (id) =>
          renderer.root
            .findAllByType("output")
            .find((node) => node.props.id === id)
            .children.join("");
        assert.equal(output("persistent-query"), "Member:0");
        await act(async () => {
          navigate(memberTree);
        });
        assert.equal(output("member-query"), "Member:0");
        assert.equal(mounts, 1);
        await act(async () => {
          navigate(publicTree);
        });
        assert.equal(unmounts, 1, "the member subtree must actually unmount");
        await act(async () => {
          client.revision++;
          client.publish();
        });
        const expected = nestedProvider ? "signed out" : "Member:1";
        assert.equal(output("persistent-query"), expected);
        assert.equal(output("public-query"), expected);
        if (!nestedProvider) {
          assert.ok(
            renderer.root
              .findAllByType("a")
              .some(
                (link) =>
                  link.props.href === "/dashboard/members/order-history",
              ),
            "public navigation can still resolve the authenticated member's role",
          );
        }
      } finally {
        if (renderer)
          await act(async () => {
            renderer.unmount();
          });
      }
    },
  );
}

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
