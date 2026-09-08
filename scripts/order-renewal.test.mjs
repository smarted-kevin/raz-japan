import assert from "node:assert/strict";
import { test } from "node:test";
import { isRenewable, compareStudentExpiry } from "../src/lib/dateCompare.ts";

const now = Date.UTC(2026, 8, 8);
const day = 86_400_000;

test("renewal window includes expired students and the exact 60-day boundary", () => {
  for (const expiry of [now - 400 * day, now - 1, now, now + 60 * day]) {
    assert.equal(isRenewable(60, expiry, now), true);
  }
  assert.equal(isRenewable(60, now + 60 * day + 1, now), false);
});

test("missing and invalid dates cannot be renewed", () => {
  for (const expiry of [undefined, NaN, Infinity, -Infinity]) {
    assert.equal(isRenewable(60, expiry, now), false);
  }
  assert.equal(isRenewable(60, now, NaN), false);
});

test("expiry sorting is oldest first, with username ties and missing dates last", () => {
  const students = [
    { username: "unknown" },
    { username: "later", expiry_date: now + 90 * day },
    { username: "zebra", expiry_date: now },
    { username: "expired", expiry_date: now - day },
    { username: "apple", expiry_date: now },
    { username: "invalid", expiry_date: NaN },
  ];
  const sorted = [...students].sort(compareStudentExpiry);
  assert.deepEqual(
    sorted.map((student) => student.username),
    ["expired", "apple", "zebra", "later", "invalid", "unknown"],
  );
  assert.equal(students[0].username, "unknown");
});

test("dashboard availability covers empty, ineligible, and mixed accounts", () => {
  const available = (students) =>
    students.some((student) => isRenewable(60, student.expiry_date, now));
  assert.equal(available([]), false);
  assert.equal(available([{ expiry_date: now + 61 * day }]), false);
  assert.equal(
    available([{ expiry_date: now + 61 * day }, { expiry_date: now - day }]),
    true,
  );
});

// Run the actual mutation handlers with an in-memory database, without a deployment.
async function studentMutations() {
  const { readFileSync } = await import("node:fs");
  const { default: ts } = await import("typescript");
  const { runInNewContext } = await import("node:vm");
  const source = readFileSync(
    new URL("../convex/mutations/student.ts", import.meta.url),
    "utf8",
  );
  const code = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText;
  const exports = {};
  const register = (definition) => definition;
  runInNewContext(code, {
    exports,
    require: (name) => {
      if (name === "../_generated/server")
        return { internalMutation: register };
      if (name === "convex/values")
        return { v: new Proxy({}, { get: () => () => ({}) }) };
      if (name === "../lib/auth")
        return { adminMutation: register, authedMutation: register };
      if (name === "./full_order") return {};
      throw new Error(`Unexpected import ${name}`);
    },
  });
  return exports;
}

for (const status of ["removed", "inactive"]) {
  test(`reactivation restores ${status} accounts and grants a future year`, async () => {
    const mutations = await studentMutations();
    const record = { status, expiry_date: now - 800 * day };
    const before = Date.now();
    await mutations.reactivateStudent.handler(
      {
        db: {
          get: async () => record,
          patch: async (_id, changes) => Object.assign(record, changes),
        },
      },
      { student_id: "student" },
    );
    assert.equal(record.status, "active");
    assert.ok(record.expiry_date >= before + 364 * day);
    assert.ok(record.expiry_date <= Date.now() + 367 * day);
  });
}

test("renewal of an active but expired account starts from today", async () => {
  const mutations = await studentMutations();
  const record = { status: "active", expiry_date: now - 800 * day };
  const before = Date.now();
  await mutations.renewStudent.handler(
    {
      db: {
        get: async () => record,
        patch: async (_id, changes) => Object.assign(record, changes),
      },
    },
    { student_id: "student" },
  );
  assert.ok(record.expiry_date >= before + 364 * day);
});

test("early renewal preserves remaining subscription time", async () => {
  const mutations = await studentMutations();
  const expiry = Date.now() + 30 * day;
  const expected = new Date(expiry);
  expected.setFullYear(expected.getFullYear() + 1);
  const record = { status: "active", expiry_date: expiry };
  await mutations.renewStudent.handler(
    {
      db: {
        get: async () => record,
        patch: async (_id, changes) => Object.assign(record, changes),
      },
    },
    { student_id: "student" },
  );
  assert.equal(record.expiry_date, expected.getTime());
});
