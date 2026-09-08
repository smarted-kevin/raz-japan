import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
import { httpRouter } from 'convex/server';

const calls = [];
const createAuth = (_ctx, options = {}) => ({ handler: async () => { calls.push(options); return new Response('ok'); } });
const exports = {};
const code = ts.transpileModule(readFileSync(new URL('../convex/http.ts', import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText;
runInNewContext(code, { exports, require: name => {
  if (name === 'convex/server') return { httpRouter };
  if (name === './_generated/server') return { httpAction: handler => handler };
  if (name === './_generated/api') return { internal: {} };
  if (name === './auth') return { createAuth, authComponent: { registerRoutes: (http, factory) => {
    for (const method of ['GET', 'POST']) http.route({ pathPrefix: '/api/auth/', method,
      handler: (ctx, request) => factory(ctx).handler(request) });
  } } };
  throw new Error(`Unexpected import ${name}`);
} });
const router = exports.default;

test('only exact public metadata GET routes opt out of database rate limiting', async () => {
  for (const path of ['/api/auth/convex/jwks', '/api/auth/convex/.well-known/openid-configuration']) {
    await router.lookup(path, 'GET')[0]({}, new Request(`https://example.com${path}`));
    assert.equal(calls.pop().publicMetadata, true);
    await router.lookup(path, 'POST')[0]({}, new Request(`https://example.com${path}`, { method: 'POST' }));
    assert.equal(calls.pop().publicMetadata, undefined);
  }
  for (const path of ['/api/auth/sign-in/email', '/api/auth/sign-up/email', '/api/auth/reset-password', '/api/auth/get-session', '/api/auth/convex/token', '/api/auth/convex/jwks/other']) {
    await router.lookup(path, 'GET')[0]({}, new Request(`https://example.com${path}`));
    assert.equal(calls.pop().publicMetadata, undefined);
  }
});
