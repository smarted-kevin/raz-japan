import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
import * as jsxRuntime from 'react/jsx-runtime';
import { ConvexError } from 'convex/values';

function load(path, imports) {
  const exports = {};
  const code = ts.transpileModule(readFileSync(new URL(path, import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  runInNewContext(code, { exports, require: name => {
    assert.ok(name in imports, `Unexpected import: ${name}`);
    return imports[name];
  } });
  return exports;
}

const { createOrganization, editOrganization } = load('../convex/mutations/organization.ts', {
  'convex/values': { ConvexError, v: new Proxy({}, { get: () => () => ({}) }) },
  '../lib/auth': { adminMutation: definition => definition, requireOrganizationAccess: () => {} },
});

for (const role of ['admin', 'org_admin', 'user']) {
  test(`${role} cannot edit organization names or status`, async () => {
    for (const update of [{ org_name: 'Changed' }, { status: 'inactive' }]) {
      await assert.rejects(editOrganization.handler({ user: { role }, db: {
        get: () => assert.fail('Unauthorized read'),
        patch: () => assert.fail('Unauthorized write'),
      } }, { id: 'org', ...update }), error => error.data.code === 'FORBIDDEN');
    }
  });
  test(`${role} cannot create organizations through the mutation`, async () => {
    await assert.rejects(createOrganization.handler({ user: { role }, db: {
      query: () => assert.fail('Unauthorized query'),
      insert: () => assert.fail('Unauthorized write'),
    } }, { name: 'School' }), error => error.data.code === 'FORBIDDEN');
  });
}

test('god edits name and status, preserves omitted fields, and rejects invalid updates', async () => {
  let organization = { _id: 'org', organization_name: 'School', status: 'active' };
  const writes = [];
  const ctx = { user: { role: 'god' }, db: {
    get: async id => id === 'org' ? organization : null,
    query: () => ({ withIndex: (_index, filter) => {
      let name;
      filter({ eq: (_field, value) => { name = value; } });
      return { collect: async () => [organization, { _id: 'other', organization_name: 'Existing' }].filter(org => org.organization_name === name) };
    } }),
    patch: async (id, changes) => { assert.equal(id, 'org'); writes.push(changes); organization = { ...organization, ...changes }; },
  } };
  await editOrganization.handler(ctx, { id: 'org', org_name: ' New School ', status: 'inactive' });
  assert.equal(organization.organization_name, 'New School');
  assert.equal(organization.status, 'inactive');
  await editOrganization.handler(ctx, { id: 'org', status: 'active' });
  assert.equal(organization.organization_name, 'New School');
  assert.equal(organization.status, 'active');
  await editOrganization.handler(ctx, { id: 'org', org_name: 'Renamed' });
  assert.equal(organization.status, 'active');
  await editOrganization.handler(ctx, { id: 'org', org_name: ' Renamed ' });
  for (const [args, code] of [
    [{ id: 'org', org_name: ' \t ' }, 'NAME_REQUIRED'],
    [{ id: 'org', org_name: ' Existing ' }, 'DUPLICATE_NAME'],
    [{ id: 'missing', org_name: 'Test' }, 'NOT_FOUND'],
  ]) {
    await assert.rejects(editOrganization.handler(ctx, args), error => error.data.code === code);
  }
  assert.equal(writes.length, 4);
});

test('god can create an active organization with a trimmed, unique name', async () => {
  const records = [];
  const ctx = { user: { role: 'god' }, db: {
    query: () => ({ withIndex: (index, filter) => {
      assert.equal(index, 'by_organization_name');
      let name;
      filter({ eq: (field, value) => { assert.equal(field, 'organization_name'); name = value; } });
      return { first: async () => records.find(record => record.organization_name === name) };
    } }),
    insert: async (table, value) => {
      assert.equal(table, 'organization');
      records.push(value);
      return 'new-org';
    },
  } };
  assert.equal(await createOrganization.handler(ctx, { name: '  School  ' }), 'new-org');
  assert.equal(records[0].organization_name, 'School');
  assert.equal(records[0].status, 'active');
  await assert.rejects(createOrganization.handler(ctx, { name: ' School ' }), error => error.data.code === 'DUPLICATE_NAME');
  await assert.rejects(createOrganization.handler(ctx, { name: ' \t ' }), error => error.data.code === 'NAME_REQUIRED');
  assert.equal(records.length, 1);
});

for (const role of ['god', 'admin', 'org_admin', 'user', 'no session', 'no token']) {
  test(`Organizations page access: ${role}`, async () => {
    const calls = [];
    const { default: page } = load('../src/app/dashboard/admin/organizations/page.tsx', {
      'react/jsx-runtime': jsxRuntime,
      './_components/organizationTable': { default: () => null },
      '../../../../../convex/_generated/api': { api: {
        auth: { getCurrentUser: 'current-user' },
        queries: { organization: { getAllOrganizations: 'organizations' } },
      } },
      'convex/nextjs': { fetchQuery: async (query, _args, options) => {
        calls.push(query);
        assert.equal(options.token, 'token');
        return query === 'current-user' ? (role === 'no session' ? null : { role }) : [];
      } },
      'next/navigation': { redirect: path => { throw new Error(`redirect:${path}`); } },
      '~/lib/auth-server': { getToken: async () => role === 'no token' ? undefined : 'token' },
      'next-intl/server': { getTranslations: async () => key => key },
    });
    if (role === 'god') {
      assert.ok(await page());
      assert.deepEqual(calls, ['current-user', 'organizations']);
    } else {
      await assert.rejects(page(), /redirect:\/sign-in/);
      assert.deepEqual(calls, role === 'no token' ? [] : ['current-user']);
    }
  });
}
