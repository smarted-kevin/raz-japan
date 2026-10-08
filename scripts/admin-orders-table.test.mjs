import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import { setImmediate as nextTurn } from "node:timers/promises";
import * as React from "react";
import * as jsxRuntime from "react/jsx-runtime";
import ts from "typescript";

// Run the component and the installed TanStack React adapter with a small hook
// scheduler, so real pagination resets must settle instead of rendering forever.
function mount(initialOrders) {
  const hooks = [];
  let cursor = 0;
  let pending = false;
  let table;
  let tree;
  let orders = initialOrders;
  const react = {
    createElement: React.createElement,
    useState(initial) {
      const index = cursor++;
      hooks[index] ??= {
        value: typeof initial === "function" ? initial() : initial,
      };
      return [
        hooks[index].value,
        (update) => {
          const value =
            typeof update === "function" ? update(hooks[index].value) : update;
          if (!Object.is(value, hooks[index].value)) {
            hooks[index].value = value;
            pending = true;
          }
        },
      ];
    },
    useMemo(create, deps) {
      const index = cursor++;
      if (
        !hooks[index] ||
        deps.some((dep, i) => !Object.is(dep, hooks[index].deps[i]))
      ) {
        hooks[index] = { value: create(), deps };
      }
      return hooks[index].value;
    },
  };
  const adapterPath = createRequire(import.meta.url).resolve(
    "@tanstack/react-table",
  );
  const adapterRequire = createRequire(adapterPath);
  const adapter = {};
  runInNewContext(readFileSync(adapterPath, "utf8"), {
    exports: adapter,
    require: (name) => (name === "react" ? react : adapterRequire(name)),
  });
  const translations = new Map();
  const primitives = (names) =>
    Object.fromEntries(names.map((name) => [name, name]));
  const imports = {
    react,
    "react/jsx-runtime": jsxRuntime,
    "next-intl": {
      useTranslations: (namespace) => {
        if (!translations.has(namespace))
          translations.set(namespace, (key) => key);
        return translations.get(namespace);
      },
    },
    "@tanstack/react-table": {
      ...adapter,
      useReactTable(options) {
        table = adapter.useReactTable(options);
        return table;
      },
    },
    "~/components/ui/table": primitives([
      "Table",
      "TableBody",
      "TableCell",
      "TableHead",
      "TableHeader",
      "TableRow",
    ]),
    "~/components/ui/select": primitives([
      "Select",
      "SelectContent",
      "SelectItem",
      "SelectTrigger",
      "SelectValue",
    ]),
    "~/components/ui/input": primitives(["Input"]),
    "~/components/ui/button": primitives(["Button"]),
    "~/components/billing/paymentPeriod": primitives([
      "PaymentPeriod",
      "InvoiceReference",
    ]),
    "lucide-react": primitives([
      "ArrowUpDown",
      "ChevronLeft",
      "ChevronRight",
      "ChevronsLeft",
      "ChevronsRight",
    ]),
    "next/link": { default: "a" },
    "~/lib/formatters": { dateDisplayFormat: (value) => String(value) },
  };
  const componentExports = {};
  const source = readFileSync(
    new URL(
      "../src/app/dashboard/admin/orders/_components/orderTable.tsx",
      import.meta.url,
    ),
    "utf8",
  );
  const code = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.ReactJSX,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  runInNewContext(code, {
    exports: componentExports,
    require: (name) => {
      assert.ok(name in imports, `Unexpected import: ${name}`);
      return imports[name];
    },
  });
  function render() {
    cursor = 0;
    pending = false;
    tree = componentExports.default({ orders });
  }
  function elements(node) {
    if (Array.isArray(node)) return node.flatMap((child) => elements(child));
    if (!node || typeof node !== "object" || !node.props) return [];
    return [node, ...elements(node.props.children)];
  }
  return {
    get table() {
      return table;
    },
    render,
    replaceOrders(value) {
      orders = value;
      render();
    },
    select(index, value) {
      elements(tree)
        .filter((node) => node.type === "Select")
        [index].props.onValueChange(value);
    },
    search(value) {
      elements(tree)
        .find((node) => node.type === "Input")
        .props.onChange({ target: { value } });
    },
    async settle() {
      let renders = 0;
      do {
        await nextTurn();
        if (!pending) return;
        assert.ok(
          ++renders <= 10,
          "Orders table entered an endless render/reset cycle",
        );
        render();
      } while (true);
    },
  };
}

const orders = Array.from({ length: 25 }, (_, index) => ({
  order_id: `order-${index}`,
  order_number: index + 1,
  email: `payer${index}@example.com`,
  amount: index * 100,
  created_date: index,
  status: index % 2 ? "pending" : "fulfilled",
  student_orders: [
    {
      id: `student-order-${index}`,
      username: `student-${index}`,
      amount: index * 100,
      // Legacy orders with no billing model are annual purchases.
      ...(index % 3 === 0 ? { billing_model: "monthly_subscription" } : {}),
    },
  ],
}));

test("Orders table settles after loading, pagination, sorting, and another render", async () => {
  const view = mount(orders);
  view.render();
  await view.settle();
  assert.equal(view.table.getPageCount(), 3);
  view.table.nextPage();
  await view.settle();
  assert.equal(view.table.getState().pagination.pageIndex, 1);
  assert.equal(view.table.getRowModel().rows[0].original.order_id, "order-10");
  view.render();
  await view.settle();
  assert.equal(view.table.getState().pagination.pageIndex, 1);
  view.table.getColumn("amount").toggleSorting(true);
  await view.settle();
  assert.equal(view.table.getState().pagination.pageIndex, 0);
  assert.equal(view.table.getRowModel().rows[0].original.amount, 2400);
});

test("Status and billing filters reset pagination once and preserve legacy annual orders", async () => {
  const view = mount(orders);
  view.render();
  await view.settle();
  view.table.setPageIndex(2);
  await view.settle();
  view.select(0, "fulfilled");
  await view.settle();
  assert.equal(view.table.getState().pagination.pageIndex, 0);
  assert.equal(view.table.getFilteredRowModel().rows.length, 13);
  view.select(1, "monthly_subscription");
  await view.settle();
  assert.deepEqual(
    view.table.getFilteredRowModel().rows.map((row) => row.original.order_id),
    ["order-0", "order-6", "order-12", "order-18", "order-24"],
  );
  view.select(1, "annual_purchase");
  await view.settle();
  assert.equal(view.table.getFilteredRowModel().rows.length, 8);
  view.search("payer2@");
  await view.settle();
  assert.equal(
    view.table.getFilteredRowModel().rows[0].original.order_id,
    "order-2",
  );
  view.search("nobody");
  await view.settle();
  assert.equal(view.table.getRowModel().rows.length, 0);
});

test("Replacing loaded orders updates rows and settles the pagination reset", async () => {
  const view = mount(orders);
  view.render();
  await view.settle();
  view.table.setPageIndex(2);
  await view.settle();
  view.replaceOrders(orders.slice(0, 3));
  await view.settle();
  assert.equal(view.table.getState().pagination.pageIndex, 0);
  assert.equal(view.table.getRowModel().rows.length, 3);
});
