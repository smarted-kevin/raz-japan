import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
import * as jsxRuntime from 'react/jsx-runtime';

function load(path, imports) {
  const exports = {};
  const code = ts.transpileModule(readFileSync(new URL(path, import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  runInNewContext(code, { exports, require: name => {
    if (!(name in imports)) throw new Error(`Unexpected import: ${name}`);
    return imports[name];
  } });
  return exports.default;
}

for (const role of ['admin', 'org_admin', 'god', 'user', 'no session', 'no token']) {
  test(`Users page access: ${role}`, async () => {
    const calls = [];
    const page = load('../src/app/dashboard/admin/users/page.tsx', {
      'react/jsx-runtime': jsxRuntime,
      './_components/userTable': { default: () => null },
      '../../../../../convex/_generated/api': { api: {
        auth: { getCurrentUser: 'current-user' },
        queries: {
          users: { getUsersWithStudents: 'users' },
          organization: { getAllOrganizations: 'organizations' },
        },
      } },
      'convex/nextjs': { fetchQuery: async (query, _args, options) => {
        calls.push(query);
        assert.equal(options.token, 'session-token');
        return query === 'current-user' ? (role === 'no session' ? null : { role }) : [];
      } },
      'next/navigation': { redirect: path => { throw new Error(`redirect:${path}`); } },
      '~/lib/auth-server': { getToken: async () => role === 'no token' ? undefined : 'session-token' },
      'next-intl/server': { getTranslations: async () => key => key },
    });
    if (['admin', 'org_admin', 'god'].includes(role)) {
      assert.ok(await page());
      assert.deepEqual(calls, ['current-user', 'users', 'organizations']);
    } else {
      await assert.rejects(page(), /redirect:\/sign-in/);
      assert.deepEqual(calls, role === 'no token' ? [] : ['current-user']);
    }
  });
}

for (const component of ['navLinks', 'sidebarNav']) {
  for (const role of ['admin', 'org_admin', 'god', 'user']) {
    test(`${component} Users link visibility: ${role}`, () => {
      const nav = load(`../src/app/dashboard/admin/_components/${component}.tsx`, {
        'react/jsx-runtime': jsxRuntime,
        'next/link': { default: 'a' },
        'next/navigation': { usePathname: () => '/dashboard/admin/users' },
        'next-intl': { useTranslations: () => key => key },
        'lucide-react': {},
        '~/lib/utils': { cn: () => '' },
      });
      const links = nav({ role }).props.children;
      assert.equal(links.some(link => link.props.href === '/dashboard/admin/users'), role !== 'user');
    });
  }
}
