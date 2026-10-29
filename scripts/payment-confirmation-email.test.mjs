import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { test } from "node:test";
import { render } from "@react-email/render";
import ts from "typescript";
import { loadBilling, MemoryDB } from "./billing-test-helpers.mjs";

const filename = resolve("src/components/payment-confirmation-email.tsx");
const loaded = { exports: {} };
const code = ts.transpileModule(readFileSync(filename, "utf8"), {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    jsx: ts.JsxEmit.ReactJSX,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;
new Function("require", "module", "exports", code)(
  createRequire(filename),
  loaded,
  loaded.exports,
);

function fixture() {
  const db = new MemoryDB();
  db.add("full_order", "order", {
    order_number: "RAZ-TEST-001",
    user_id: "owner",
    status: "fulfilled",
  });
  db.add("classroom", "room", { classroom_name: "sample-class" });
  for (const id of ["new", "renewal", "unrelated", "transferred"]) {
    db.add("student", id, {
      user_id: id === "transferred" ? "other" : "owner",
      classroom_id: "room",
      username: `sample-${id}`,
      password: `test-password-${id}`,
      expiry_date: Date.UTC(2028, 9, 29),
    });
    db.add("student_order", `item-${id}`, {
      student_id: id,
      order_id: id === "unrelated" ? "another-order" : "order",
      period_end: id === "new" ? Date.UTC(2027, 9, 29) : undefined,
    });
  }
  const query =
    loadBilling().load("queries/full_order").getPaymentEmailStudents;
  return {
    db,
    run: (args = {}) =>
      query.handler(
        { db },
        {
          orderNumber: "RAZ-TEST-001",
          userId: "owner",
          ...args,
        },
      ),
  };
}

test("email includes only the purchased accounts still owned by its recipient", async () => {
  const { run } = fixture();
  const students = await run();
  assert.equal(students.length, 2);
  assert.deepEqual(
    Array.from(students, (student) => student.username),
    ["sample-new", "sample-renewal"],
  );
  assert.equal(students[0].classroomName, "sample-class");
  assert.equal(students[0].password, "test-password-new");
  assert.equal(students[0].expiryDate, Date.UTC(2027, 9, 29));
  assert.equal(students[1].expiryDate, Date.UTC(2028, 9, 29));
});

test("email refuses mismatched recipients, missing orders, and unfulfilled orders", async () => {
  const { db, run } = fixture();
  await assert.rejects(run({ userId: "other" }), /Fulfilled order not found/);
  await assert.rejects(
    run({ orderNumber: "missing" }),
    /Fulfilled order not found/,
  );
  for (const status of ["created", "pending", "canceled"]) {
    await db.patch("order", { status });
    await assert.rejects(run(), /Fulfilled order not found/);
  }
});

test("email safely renders all account details and Japanese instructions before English", async () => {
  const { run } = fixture();
  const students = await run();
  students[0].password = '<sample>&"password';
  // This timestamp is October 29 in Japan, October 28 in UTC.
  students[0].expiryDate = Date.UTC(2027, 9, 28, 15);
  const html = await render(
    loaded.exports.PaymentConfirmationEmail({
      firstName: "Sample",
      orderId: "RAZ-TEST-001",
      totalAmount: 15000,
      students,
    }),
  );
  for (const value of [
    "sample-class",
    "sample-new",
    "sample-renewal",
    "2027/10/29",
    "Classroom name",
    "Student Username",
    "Student Password",
    "Expiry Date",
  ]) {
    assert.ok(html.includes(value), `Missing ${value}`);
  }
  assert.ok(html.includes("&lt;sample&gt;&amp;&quot;password"));
  assert.ok(!html.includes(students[0].password));
  assert.ok(
    html.indexOf("ご利用開始の手順") < html.indexOf("How to Get Started"),
  );
  assert.equal((html.match(/<li\b/g) ?? []).length, 10);
  assert.equal((html.match(/href="https:\/\/kidsa-z.com"/g) ?? []).length, 2);
  assert.ok(html.includes("Kids A-Z"));
});

test("missing classroom and expiry date render a clear fallback", async () => {
  const { db, run } = fixture();
  await db.patch("new", { classroom_id: undefined, expiry_date: undefined });
  await db.patch("item-new", { period_end: undefined });
  const html = await render(
    loaded.exports.PaymentConfirmationEmail({
      firstName: "Sample",
      orderId: "RAZ-TEST-001",
      totalAmount: 15000,
      students: await run(),
    }),
  );
  assert.ok(html.includes("未設定 / Not available"));
  assert.ok(!html.includes("Invalid Date"));
});
