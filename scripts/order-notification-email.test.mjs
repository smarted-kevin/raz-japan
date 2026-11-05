import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { test } from "node:test";
import { render } from "@react-email/render";
import ts from "typescript";
import { loadBilling } from "./billing-test-helpers.mjs";

const filename = resolve("src/components/order-notification-email.tsx");
const template = { exports: {} };
new Function(
  "require",
  "module",
  "exports",
  ts.transpileModule(readFileSync(filename, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.ReactJSX,
    },
  }).outputText,
)(createRequire(filename), template, template.exports);

function setup() {
  const messages = [];
  const order = {
    status: "fulfilled",
    order_number: "RAZ-TEST-001",
    total_amount: 15000,
    user_id: "payer",
  };
  const user = { email: "customer@example.test" };
  let deliveryError = null;
  const runtime = loadBilling({
    mocks: {
      resend: {
        Resend: class {
          emails = {
            send: async (...args) => {
              messages.push(args);
              return { error: deliveryError };
            },
          };
        },
      },
      "@react-email/render": { render },
      "../src/components/order-notification-email": template.exports,
      "../src/components/payment-confirmation-email": {},
      "../src/components/renewal-notice-email": {},
    },
  });
  const action = runtime.load("email").sendOrderNotificationEmail;
  const ctx = {
    runQuery: async (ref, args) => {
      if (ref.__path === "internal.queries.full_order.getOrderByIdInternal") {
        assert.equal(args.id, "order");
        return order;
      }
      assert.equal(args.id, "payer");
      return user;
    },
  };
  return {
    messages,
    order,
    user,
    fail: () => {
      deliveryError = { message: "Rejected" };
    },
    run: () => action.handler(ctx, { order_id: "order" }),
  };
}

test("completed order notifies the fixed recipients with only the requested details", async () => {
  const f = setup();
  await f.run();
  const [message, options] = f.messages[0];
  assert.equal(message.to, "raz@smarted.jp");
  assert.equal(message.bcc, "kevin@smarted.jp");
  assert.equal(message.subject, "Order completed - RAZ-TEST-001");
  assert.equal(options.idempotencyKey, "order-notification/order");
  for (const detail of [
    "Order#",
    "RAZ-TEST-001",
    "Amount of purchase",
    "￥15,000",
    "Customer email",
    "customer@example.test",
  ])
    assert.ok(message.html.includes(detail), `Missing ${detail}`);
  assert.equal((message.html.match(/<p\b/g) ?? []).length, 3);
  await f.run();
  assert.equal(f.messages[1][1].idempotencyKey, options.idempotencyKey);
});

test("unfulfilled orders and missing customer email cannot send notifications", async () => {
  const f = setup();
  for (const status of ["created", "pending", "canceled"]) {
    f.order.status = status;
    await assert.rejects(f.run(), /Fulfilled order not found/);
  }
  f.order.status = "fulfilled";
  f.user.email = undefined;
  await assert.rejects(f.run(), /customer email missing/);
  assert.equal(f.messages.length, 0);
});

test("delivery errors fail the scheduled action visibly", async () => {
  const f = setup();
  f.fail();
  await assert.rejects(f.run(), /notification delivery failed/);
});

test("template escapes customer data", async () => {
  const html = await render(
    template.exports.OrderNotificationEmail({
      orderNumber: "<order>",
      totalAmount: 0,
      customerEmail: "<customer>&@example.test",
    }),
  );
  assert.ok(html.includes("&lt;order&gt;"));
  assert.ok(html.includes("&lt;customer&gt;&amp;@example.test"));
  assert.ok(html.includes("￥0"));
});
