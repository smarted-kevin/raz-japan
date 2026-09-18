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

const register = definition => definition;
const values = { ConvexError: Error, v: new Proxy({}, { get: () => () => ({}) }) };
const auth = load('../convex/lib/auth.ts', {
  'convex/values': values,
  '../_generated/server': {},
  'convex-helpers/server/customFunctions': {
    customCtx: register, customQuery: () => register, customMutation: () => register,
  },
});
const queries = load('../convex/queries/users.ts', {
  'convex/values': values, '../lib/auth': auth, '../_generated/server': { internalQuery: register },
});
const mutations = load('../convex/mutations/users.ts', {
  'convex/values': values, '../lib/auth': auth, '../_generated/server': { internalMutation: register },
});
const god = { _id: 'god-id', auth_id: 'god-auth', role: 'god', org_id: 'org-a', email: 'private@example.com' };
const member = { _id: 'member-id', role: 'user', org_id: 'org-a' };
const otherMember = { _id: 'other-member', role: 'user', org_id: 'org-b' };
const users = [god, member, otherMember];

function context(role, target = god) {
  return {
    user: { _id: 'caller', role, org_id: 'org-a' },
    db: {
      get: async () => target,
      query: table => {
        let result = table === 'userTable' ? users : [];
        const chain = {
          withIndex: (_index, filter) => {
            filter({ eq: (field, value) => { result = result.filter(user => user[field] === value); } });
            return chain;
          },
          collect: async () => result,
          first: async () => target,
        };
        return chain;
      },
      patch: async () => assert.fail('Unauthorized database write'),
    },
  };
}

for (const role of ['admin', 'org_admin']) {
  test(`${role} cannot retrieve god accounts through any user lookup`, async () => {
    for (const [name, args] of [
      ['getUserById', { id: god._id }],
      ['getUserByEmail', { email: god.email }],
      ['getUserWithStudents', { id: god._id }],
      ['getUserDetailForAdmin', { id: god._id }],
      ['getUserRoleByAuthId', { userId: god.auth_id }],
      ['getStripeUserInfoByAuthId', { userId: god.auth_id }],
      ['getUserWithOrgId', { id: god._id }],
    ]) {
      await assert.rejects(queries[name].handler(context(role), args), /User access denied/);
    }
  });
  test(`${role} cannot list or change god accounts`, async () => {
    const ctx = context(role);
    assert.equal((await queries.getUsersByRole.handler(ctx, { role: 'god' })).length, 0);
    const rows = await queries.getUsersWithStudents(ctx);
    assert.deepEqual(Array.from(rows, row => row.id), role === 'admin' ? [member._id, otherMember._id] : [member._id]);
    await assert.rejects(mutations.updateUserRole.handler(ctx, { userId: god._id, role: 'user' }));
  });
}

test('god retains access; normal admin and organization scopes are preserved', async () => {
  assert.equal(await queries.getUserById.handler(context('god'), { id: god._id }), god);
  assert.equal((await queries.getUsersWithStudents(context('god'))).length, 3);
  assert.equal(auth.canAccessUser(context('admin').user, member), true);
  assert.equal(auth.canAccessUser(context('org_admin').user, otherMember), false);
  assert.equal(auth.canAccessUser({ _id: 'org-admin', role: 'org_admin' }, { _id: 'unscoped', role: 'user' }), false);
  assert.equal(auth.canAccessUser(member, member), true);
});

const stripe = load('../convex/stripe.ts', {
  'convex/values': values,
  './_generated/server': { action: register, internalAction: register },
  './_generated/api': { api: { queries: { users: { getUserById: 'target', getUserRoleByAuthId: 'caller' } } }, internal: {} },
  stripe: { default: class { constructor() { assert.fail('Unauthorized Stripe call'); } } },
});
test('admin profile edits reject god targets before any database or Stripe write', async () => {
  const ctx = context('admin');
  await assert.rejects(stripe.adminUpdateUserInfo.handler({
    auth: { getUserIdentity: async () => ({ subject: 'admin-auth' }) },
    runQuery: async (query, args) => query === 'caller' ? ctx.user : queries.getUserById.handler(ctx, args),
    runMutation: async () => assert.fail('Unauthorized mutation'),
  }, { userId: god._id, first_name: 'Changed', email: 'changed@example.com', status: 'inactive' }), /User access denied/);
});

const relatedImports = {
  'convex/values': values, '../lib/auth': auth, '../_generated/server': { internalQuery: register },
};
const orderQueries = load('../convex/queries/full_order.ts', relatedImports);
const studentQueries = load('../convex/queries/student.ts', relatedImports);
test('order lists omit god owners and student lists redact their user information', async () => {
  const rows = [{ _id: 'related-record', user_id: god._id, classroom_id: 'classroom' }];
  for (const role of ['admin', 'god']) {
    const ctx = context(role);
    ctx.db.get = async id => id === 'classroom' ? { organization_id: 'org-a' } : god;
    ctx.db.query = table => {
      const chain = {
        withIndex: () => chain,
        collect: async () => table === 'student_order' ? [] : table === 'classroom' ? [{ _id: 'classroom' }] : rows,
      };
      return chain;
    };
    for (const name of ['getAllOrders', 'getOrdersWithUserAndStudentData']) {
      const orders = await orderQueries[name].handler(ctx, {});
      assert.equal(orders.length, role === 'god' ? 1 : 0);
    }
    for (const name of ['getAllStudentsWithClassroomAndUser', 'getStudentsByOrganization']) {
      const students = await studentQueries[name].handler(ctx, { org_id: 'org-a' });
      assert.equal(students[0].user_email, role === 'god' ? god.email : undefined);
      assert.equal(students[0].user_id, role === 'god' ? god._id : undefined);
    }
  }
});

const { createAuthAdminGuard } = load('../convex/lib/authAdminGuard.ts', {
  'better-auth/api': {
    APIError: class extends Error { constructor(code) { super(code); } },
    createAuthMiddleware: register,
    getSessionFromCtx: async ctx => ({ user: { id: ctx.callerRole === 'god' ? god.auth_id : 'admin-auth', role: ctx.callerRole ?? 'admin' } }),
  },
});
const authAdminGuard = createAuthAdminGuard(async () => [god.auth_id]);
function httpContext(path, body = {}, query = {}) {
  return { path, body, query, context: { internalAdapter: {
    findUserById: async id => id === god._id ? god : member,
    findSession: async () => ({ user: god }),
  } } };
}
test('auth HTTP endpoints block direct reads, edits, deletion, impersonation, and password/session changes', async () => {
  for (const endpoint of ['update-user', 'set-role', 'remove-user', 'ban-user', 'unban-user', 'impersonate-user', 'set-user-password', 'list-user-sessions', 'revoke-user-sessions']) {
    await assert.rejects(authAdminGuard(httpContext(`/admin/${endpoint}`, { userId: god._id })), /FORBIDDEN/);
  }
  await assert.rejects(authAdminGuard(httpContext('/admin/get-user', {}, { id: god._id })), /FORBIDDEN/);
  await assert.rejects(authAdminGuard(httpContext('/admin/revoke-user-session', { sessionToken: 'god-session' })), /FORBIDDEN/);
});
test('auth HTTP endpoints prevent creating or promoting a god account', async () => {
  for (const role of ['god', 'admin,god', ['admin', 'god']]) {
    for (const body of [{ role }, { data: { role } }]) {
      await assert.rejects(authAdminGuard(httpContext('/admin/create-user', body)), /FORBIDDEN/);
      await assert.rejects(authAdminGuard(httpContext('/admin/update-user', { userId: member._id, ...body })), /FORBIDDEN/);
    }
  }
});
test('auth HTTP endpoints also protect application god users with a stale auth role', async () => {
  await assert.rejects(authAdminGuard(httpContext('/admin/update-user', { userId: god.auth_id })), /FORBIDDEN/);
});
test('auth HTTP endpoints keep ordinary account edits and god access', async () => {
  assert.equal(await authAdminGuard(httpContext('/admin/update-user', { userId: member._id })), undefined);
  assert.equal(await authAdminGuard({ ...httpContext('/admin/update-user', { userId: god._id }), callerRole: 'god' }), undefined);
});
test('auth user list excludes god before pagination and counts without replacing caller filters', async () => {
  const ctx = httpContext('/admin/list-users');
  const calls = [];
  ctx.context.internalAdapter.listUsers = async (...args) => { calls.push(args); return []; };
  ctx.context.internalAdapter.countTotalUsers = async where => { calls.push(where); return 0; };
  const result = await authAdminGuard(ctx);
  const filter = { field: 'email', value: 'example.com', operator: 'contains' };
  await result.context.internalAdapter.listUsers(10, 20, { field: 'name' }, [filter]);
  await result.context.internalAdapter.countTotalUsers([filter]);
  assert.equal(calls[0][0], 10);
  assert.equal(calls[0][1], 20);
  assert.equal(calls[0][3][0], filter);
  assert.equal(calls[0][3][1].field, 'role');
  assert.equal(calls[0][3][1].operator, 'ne');
  assert.equal(calls[0][3][1].value, 'god');
  assert.equal(calls[0][3][2].field, 'id');
  assert.equal(calls[0][3][2].value, god.auth_id);
  assert.equal(JSON.stringify(calls[1]), JSON.stringify(calls[0][3]));
});
