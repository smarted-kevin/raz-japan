import assert from "node:assert/strict";
import { test } from "node:test";
import { runVercelBuild } from "./vercel-build.mjs";

test("production builds require a deploy key before running any command", () => {
  for (const key of [undefined, "", "   "]) {
    assert.throws(
      () =>
        runVercelBuild(
          { VERCEL_ENV: "production", CONVEX_DEPLOY_KEY: key },
          () => {
            assert.fail("must not run a build without a production deploy key");
          },
        ),
      /Production builds require CONVEX_DEPLOY_KEY/,
    );
  }
});

test("production builds use Convex deploy and inject the backend URL into Next.js", () => {
  const env = { VERCEL_ENV: "production", CONVEX_DEPLOY_KEY: "test-only" };
  const status = runVercelBuild(env, (command, options) => {
    assert.equal(
      command,
      'pnpm exec convex deploy --cmd-url-env-var-name NEXT_PUBLIC_CONVEX_URL --cmd "pnpm build"',
    );
    assert.equal(options.env, env);
    return { status: 0 };
  });
  assert.equal(status, 0);
});

test("preview and local builds never deploy Convex even with a key present", () => {
  for (const environment of ["preview", "development", undefined]) {
    runVercelBuild(
      { VERCEL_ENV: environment, CONVEX_DEPLOY_KEY: "test-only" },
      (command) => {
        assert.equal(command, "pnpm build");
        return { status: 0 };
      },
    );
  }
});

test("deployment failures fail the Vercel build", () => {
  const env = { VERCEL_ENV: "production", CONVEX_DEPLOY_KEY: "test-only" };
  assert.equal(
    runVercelBuild(env, () => ({ status: 7 })),
    7,
  );
  assert.equal(
    runVercelBuild(env, () => ({ status: null })),
    1,
  );
  assert.throws(
    () => runVercelBuild(env, () => ({ error: new Error("could not start") })),
    /could not start/,
  );
});
