import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { runInNewContext } from "node:vm";
import ts from "typescript";

export function loadBilling({ stripe, env = {} } = {}) {
  const cache = new Map();
  const register = (definition) =>
    typeof definition === "function" ? { handler: definition } : definition;
  const reference = (path) =>
    new Proxy(
      {},
      {
        get: (_target, key) =>
          key === "__path" ? path : reference(`${path}.${String(key)}`),
      },
    );
  const root = resolve("convex");
  function load(file) {
    const full = resolve(file);
    if (cache.has(full)) return cache.get(full);
    const exports = {};
    cache.set(full, exports);
    const code = ts.transpileModule(readFileSync(full, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
    }).outputText;
    runInNewContext(code, {
      exports,
      Date,
      Set,
      Map,
      Promise,
      console,
      process: {
        env: {
          MONTHLY_SUBSCRIPTIONS_ENABLED: "true",
          SITE_URL: "https://example.test",
          STRIPE_SECRET_KEY: "sk_test_fake",
          ...env,
        },
      },
      require: (name) => {
        if (name.includes("_generated/server"))
          return {
            internalMutation: register,
            internalQuery: register,
            internalAction: register,
            action: register,
            query: register,
            mutation: register,
          };
        if (name.includes("_generated/api"))
          return { api: reference("api"), internal: reference("internal") };
        if (name === "convex/values")
          return {
            v: new Proxy({}, { get: () => () => ({}) }),
            ConvexError: Error,
          };
        if (name === "convex-helpers/server/customFunctions")
          return {
            customCtx: (x) => x,
            customQuery: () => register,
            customMutation: () => register,
          };
        if (name === "stripe")
          return {
            default: class {
              constructor() {
                if (!stripe) throw new Error("Unexpected Stripe request");
                return stripe;
              }
            },
          };
        if (name.startsWith("."))
          return load(resolve(dirname(full), `${name}.ts`));
        throw new Error(`Unexpected test import: ${name}`);
      },
    });
    return exports;
  }
  return {
    load: (name) => load(resolve(root, `${name}.ts`)),
    context(db, caller = "user") {
      const ctx = {
        db,
        user: db.rows.get(caller),
        auth: {
          getUserIdentity: async () => ({
            subject: db.rows.get(caller)?.auth_id,
          }),
        },
        scheduler: { runAfter: async () => {} },
      };
      const invoke = async (ref, args) => {
        const [, ...parts] = ref.__path.split(".");
        const fn = parts.pop();
        return load(resolve(root, `${parts.join("/")}.ts`))[fn].handler(
          ctx,
          args,
        );
      };
      ctx.runQuery = invoke;
      ctx.runMutation = (ref, args) => db.transaction(() => invoke(ref, args));
      ctx.runAction = invoke;
      return ctx;
    },
  };
}

export class MemoryDB {
  rows = new Map();
  next = 0;
  queue = Promise.resolve();
  add(table, id, values) {
    this.rows.set(id, {
      _id: id,
      _creationTime: Date.now(),
      __table: table,
      ...values,
    });
    return id;
  }
  async get(id) {
    return this.rows.has(id) ? structuredClone(this.rows.get(id)) : null;
  }
  async patch(id, fields) {
    if (!this.rows.has(id)) throw new Error(`Missing ${id}`);
    Object.assign(this.rows.get(id), fields);
  }
  async insert(table, fields) {
    const id = `${table}:${++this.next}`;
    return this.add(table, id, fields);
  }
  query(table) {
    const predicates = [];
    const builder = {};
    for (const op of ["eq", "gt", "gte", "lt", "lte"])
      builder[op] = (field, value) => {
        predicates.push((row) =>
          op === "eq"
            ? row[field] === value
            : op === "gt"
              ? row[field] > value
              : op === "gte"
                ? row[field] >= value
                : op === "lt"
                  ? row[field] < value
                  : row[field] <= value,
        );
        return builder;
      };
    const collect = async () =>
      [...this.rows.values()]
        .filter(
          (row) => row.__table === table && predicates.every((p) => p(row)),
        )
        .map((row) => structuredClone(row));
    const query = {
      withIndex: (_name, fn) => {
        if (fn) fn(builder);
        return query;
      },
      collect,
      first: async () => (await collect())[0] ?? null,
      take: async (limit) => (await collect()).slice(0, limit),
      paginate: async ({ cursor, numItems }) => {
        const all = await collect();
        const start = Number(cursor ?? 0);
        return {
          page: all.slice(start, start + numItems),
          continueCursor: String(start + numItems),
          isDone: start + numItems >= all.length,
        };
      },
    };
    return query;
  }
  transaction(fn) {
    const result = this.queue.then(async () => {
      const before = structuredClone(this.rows);
      const next = this.next;
      try {
        return await fn();
      } catch (error) {
        this.rows = before;
        this.next = next;
        throw error;
      }
    });
    this.queue = result.catch(() => {});
    return result;
  }
  table(name) {
    return [...this.rows.values()].filter((row) => row.__table === name);
  }
}

export function fixture() {
  const db = new MemoryDB();
  db.add("userTable", "user", {
    auth_id: "auth:user",
    stripe_id: "cus_test",
    role: "user",
    org_id: "org",
    email: "payer@example.test",
    first_name: "Test",
    last_name: "Payer",
  });
  db.add("userTable", "other", {
    auth_id: "auth:other",
    role: "user",
    org_id: "different-org",
  });
  db.add("userTable", "admin", { auth_id: "auth:admin", role: "admin" });
  db.add("userTable", "orgadmin", {
    auth_id: "auth:orgadmin",
    role: "org_admin",
    org_id: "org",
  });
  db.add("userTable", "god", { auth_id: "auth:god", role: "god" });
  db.add("course", "monthly", {
    course_name: "Monthly",
    billing_model: "monthly_subscription",
    price: 500,
    stripe_price_id: "price_month",
    stripe_product_id: "prod_month",
    provisioning_state: "ready",
    status: "active",
  });
  db.add("course", "annual", {
    course_name: "Annual",
    price: 4500,
    stripe_price_id: "price_year",
    stripe_product_id: "prod_SXpH8diltRufBp",
    status: "active",
  });
  db.add("classroom", "monthlyroom", {
    course_id: "monthly",
    organization_id: "org",
    status: "active",
  });
  db.add("classroom", "annualroom", {
    course_id: "annual",
    organization_id: "org",
    status: "active",
  });
  db.add("student", "monthlystudent", {
    classroom_id: "monthlyroom",
    status: "inactive",
    username: "monthly",
  });
  db.add("student", "annualstudent", {
    classroom_id: "annualroom",
    status: "inactive",
    username: "annual",
  });
  return db;
}
