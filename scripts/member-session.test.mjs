import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';

function load(path, imports) {
  const exports = {};
  const code = ts.transpileModule(readFileSync(new URL(path, import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText;
  runInNewContext(code, { exports, require: name => {
    if (!(name in imports)) throw new Error(`Unexpected import: ${name}`);
    return imports[name];
  } });
  return exports;
}

const redirect = path => { throw new Error(`redirect:${path}`); };

for (const scenario of ['no token', 'no session', 'no member', 'signed in']) {
  test(`session-based member resolution: ${scenario}`, async () => {
    const calls = [];
    const { getMemberSession } = load('../src/lib/member-session.ts', {
      'server-only': {},
      'next/navigation': { redirect },
      '~/lib/auth-server': { getToken: async () => scenario === 'no token' ? undefined : 'session-token' },
      '@/convex/_generated/api': { api: {
        auth: { getCurrentUser: 'current-user' },
        queries: { users: { getUserRoleByAuthId: 'member-by-auth' } },
      } },
      'convex/nextjs': { fetchQuery: async (query, args, options) => {
        calls.push(query);
        assert.equal(options.token, 'session-token');
        if (query === 'current-user') return scenario === 'no session' ? null : { _id: 'authenticated-account' };
        assert.equal(args.userId, 'authenticated-account');
        return scenario === 'no member' ? null : { user_id: 'database-member' };
      } },
    });
    if (scenario === 'signed in') {
      const result = await getMemberSession();
      assert.equal(result.memberId, 'database-member');
      assert.equal(result.session._id, 'authenticated-account');
      assert.equal(result.token, 'session-token');
    } else {
      await assert.rejects(getMemberSession(), /redirect:\/sign-in/);
    }
    assert.equal(calls.length, scenario === 'no token' ? 0 : scenario === 'no session' ? 1 : 2);
  });
}

for (const [path, destination] of [
  ['[id]/page.tsx', '/dashboard/members'],
  ['[id]/order-history/page.tsx', '/dashboard/members/order-history'],
  ['order/[id]/page.tsx', '/dashboard/members/order'],
  ['[id]/order-history/[orderId]/page.tsx', '/dashboard/members/order-history/order-123'],
]) {
  test(`legacy bookmark redirects without its member ID: ${path}`, async () => {
    const page = load(`../src/app/dashboard/members/${path}`, { 'next/navigation': { redirect } }).default;
    await assert.rejects(async () => page({
      params: Promise.resolve({ id: 'another-member', orderId: 'order-123' }),
    }), error => error.message === `redirect:${destination}`);
  });
}
