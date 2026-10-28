import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
import { loadBilling } from './billing-test-helpers.mjs';
import { adminAc, userAc } from 'better-auth/plugins/admin/access';
import { z } from 'zod';

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
  '../lib/billing': loadBilling().load('lib/billing'),
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
  './lib/stripeBilling': { stripeClient: () => assert.fail('Unauthorized Stripe call') },
  './lib/billing': loadBilling().load('lib/billing'),
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
  '../lib/billing': loadBilling().load('lib/billing'),
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

function loadOrganizationAssignment(role, { findUser, updateRole } = {}) {
  return load('../src/app/dashboard/admin/_actions/users.ts', {
    zod: { z },
    '@/convex/_generated/api': { api: {
      auth: { getCurrentUser: 'current-user' },
      queries: { users: { getUserByEmail: 'user-by-email' } },
      mutations: { users: { updateUserRole: 'update-role' } },
    } },
    '~/lib/auth-server': { getToken: async () => role === 'no token' ? undefined : 'session-token' },
    'convex/nextjs': {
      fetchQuery: async (query, args, options) => {
        assert.equal(options.token, 'session-token');
        if (query === 'current-user') return role === 'no session' ? null : { role };
        assert.equal(query, 'user-by-email');
        assert.ok(findUser, 'Unauthorized user lookup');
        return findUser(args);
      },
      fetchMutation: async (mutation, args, options) => {
        assert.equal(mutation, 'update-role');
        assert.equal(options.token, 'session-token');
        assert.ok(updateRole, 'Unauthorized role mutation');
        return updateRole(args);
      },
    },
  }).assignOrgAdminOrganizationForCreatedUser;
}

test('god can create an organization administrator and assign its organization', async () => {
  const email = 'new-org-admin@example.com';
  await authAdminGuard({
    ...httpContext('/admin/create-user', { email, role: 'org_admin' }),
    callerRole: 'god',
  });

  let createdUser;
  const ctx = {
    user: god,
    db: {
      insert: async (table, record) => {
        assert.equal(table, 'userTable');
        createdUser = { _id: 'created-user', ...record };
        return createdUser._id;
      },
      get: async id => {
        assert.equal(id, createdUser._id);
        return createdUser;
      },
      patch: async (id, changes) => {
        assert.equal(id, createdUser._id);
        createdUser = { ...createdUser, ...changes };
      },
    },
  };
  await mutations.createUser.handler(ctx, {
    auth_id: 'created-auth-user', first_name: 'New', last_name: 'Admin',
    email, role: 'org_admin', status: 'active', updated_at: Date.now(),
  });
  assert.equal(createdUser.org_id, undefined);

  const assignOrganization = loadOrganizationAssignment('god', {
    findUser: args => {
      assert.equal(args.email, email);
      return createdUser;
    },
    updateRole: args => mutations.updateUserRole.handler(ctx, args),
  });
  const result = await assignOrganization({ email, org_id: 'org-b' });
  assert.equal(result.success, true);
  assert.equal(createdUser.role, 'org_admin');
  assert.equal(createdUser.org_id, 'org-b');
  assert.equal(createdUser.auth_id, 'created-auth-user');
});

test('admin retains organization assignment access', async () => {
  let assigned = false;
  const assignOrganization = loadOrganizationAssignment('admin', {
    findUser: () => ({ _id: 'created-user' }),
    updateRole: args => {
      assert.equal(args.userId, 'created-user');
      assert.equal(args.role, 'org_admin');
      assert.equal(args.org_id, 'org-b');
      assigned = true;
    },
  });
  assert.equal((await assignOrganization({ email: 'new@example.com', org_id: 'org-b' })).success, true);
  assert.equal(assigned, true);
});

for (const role of ['user', 'org_admin', 'no session', 'no token']) {
  test(`organization assignment rejects ${role} before looking up or changing the account`, async () => {
    const result = await loadOrganizationAssignment(role)({ email: 'new@example.com', org_id: 'org-b' });
    assert.equal(result.success, false);
    assert.equal(result.error, role === 'no token' ? 'Not authenticated' : 'Admin access required');
  });
}

const { authAdminOptions } = load('../convex/lib/authAdminOptions.ts', {
  'better-auth/plugins/admin/access': { adminAc, userAc },
});

test('Better Auth grants create permission to god and admin only', () => {
  for (const role of ['god', 'admin', 'org_admin', 'user']) {
    assert.equal(authAdminOptions.roles[role].authorize({ user: ['create'] }).success,
      role === 'god' || role === 'admin');
  }
});
function httpContext(path, body = {}, query = {}) {
  return { path, body, query, context: { internalAdapter: {
    findUserById: async id => id === god._id ? god : member,
    findSession: async () => ({ user: god }),
  } } };
}

for (const callerRole of ['god', 'admin', 'org_admin', 'user']) {
  test(`${callerRole} creation permissions validate target roles and overrides`, async () => {
    const allowed = callerRole === 'god' ? ['user', 'admin', 'org_admin'] : callerRole === 'admin' ? ['user'] : [];
    for (const role of [undefined, 'user', 'admin', 'org_admin', 'god', 'admin,god', 'user,admin', ['user'], ['admin', 'god'], 'unknown', null]) {
      for (const body of [{ role }, { data: { role } }, { role: 'user', data: { role } }]) {
        const ctx = { ...httpContext('/admin/create-user', body), callerRole };
        const effectiveRole = role ?? 'user';
        // An explicit null in data overrides the plugin's default and is invalid.
        const valid = allowed.includes(effectiveRole) && !(role === null && body.data);
        if (valid) assert.equal(await authAdminGuard(ctx), undefined);
        else await assert.rejects(authAdminGuard(ctx), /FORBIDDEN/);
      }
    }
    // A safe data override must not hide a prohibited top-level request.
    if (callerRole === 'admin') {
      await assert.rejects(authAdminGuard({ ...httpContext('/admin/create-user', { role: 'admin', data: { role: 'user' } }), callerRole }), /FORBIDDEN/);
    }
  });
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
