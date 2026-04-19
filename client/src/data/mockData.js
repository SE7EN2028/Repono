export const REPOS = [
  { id: "acme-api", name: "acme/api", branch: "main", lang: "TypeScript", files: 1247, status: "indexed" },
  { id: "acme-web", name: "acme/web", branch: "main", lang: "TypeScript", files: 2103, status: "indexed" },
  { id: "acme-infra", name: "acme/infra", branch: "main", lang: "Go", files: 418, status: "processing", progress: 62 },
  { id: "acme-sdk", name: "acme/sdk-js", branch: "v3", lang: "TypeScript", files: 286, status: "indexed" },
];

export const NAV = [
  { id: "chat", label: "Chat", icon: "Chat", count: 3 },
  { id: "map", label: "Code Map", icon: "Map" },
  { id: "files", label: "Files", icon: "Files" },
  { id: "insights", label: "Insights", icon: "Insights" },
];

export const RECENT_THREADS = [
  { id: "t1", title: "Why does checkout fail on retry?", when: "2h ago", active: true },
  { id: "t2", title: "Trace the JWT refresh path", when: "Yesterday" },
  { id: "t3", title: "Unused exports in packages/core", when: "Mon" },
  { id: "t4", title: "How does the queue backoff work?", when: "Mar 28" },
];

export const SEED_MESSAGES = [
  {
    id: "m1",
    role: "user",
    text: "Why does the checkout fail when a user retries a declined card? I see sporadic 500s in Sentry but the stack trace points to our idempotency middleware, not the payment service.",
    time: "10:42",
  },
  {
    id: "m2",
    role: "assistant",
    time: "10:42",
    blocks: [
      { type: "text", text: "Short version: the idempotency key is being **reused across retry attempts**, so the second call short-circuits to a cached 402 response before it ever reaches Stripe. The 500 is a downstream effect — `chargeResult` is undefined when the cached path is taken." },
      { type: "refs", items: [
        { file: "services/checkout/src/idempotency.ts", lines: "84–112", why: "Caches response by key with no status filter" },
        { file: "services/checkout/src/charge.ts", lines: "37–59", why: "Reads chargeResult assuming fresh call" },
      ]},
      { type: "text", text: "Here's the problematic branch:" },
      { type: "code", lang: "ts", file: "services/checkout/src/idempotency.ts", startLine: 84, code:
`export async function withIdempotency<T>(
  key: string,
  fn: () => Promise<T>,
): Promise<T> {
  const cached = await store.get(key);
  if (cached) {
    // ⚠ returns cached body regardless of prior status
    return cached.body as T;
  }
  const result = await fn();
  await store.set(key, { body: result, ttl: 3600 });
  return result;
}` },
      { type: "text", text: "Two safe fixes, in order of blast radius:" },
      { type: "list", items: [
        "Only cache on **2xx** — let declines re-hit Stripe so retries can succeed.",
        "Scope the idempotency key with `attempt_id` from the client, so a genuine retry gets a new slot.",
      ]},
      { type: "callout", kind: "info", text: "The 500 itself is a null-deref in charge.ts:48. Fix the caching and that path disappears; add a guard anyway." },
    ],
  },
];

export const CONTEXT_FILES = [
  {
    path: "services/checkout/src/idempotency.ts",
    startLine: 80,
    active: true,
    lang: "ts",
    lines: [
      "",
      "type CacheEntry<T> = { body: T; ttl: number };",
      "",
      "export async function withIdempotency<T>(",
      "  key: string,",
      "  fn: () => Promise<T>,",
      "): Promise<T> {",
      "  const cached = await store.get(key);",
      "  if (cached) {",
      "    // ⚠ returns cached body regardless of prior status",
      "    return cached.body as T;",
      "  }",
      "  const result = await fn();",
      "  await store.set(key, { body: result, ttl: 3600 });",
      "  return result;",
      "}",
      "",
      "export function keyFor(userId: string, intentId: string) {",
      "  return `ck:${userId}:${intentId}`;",
      "}",
    ],
    highlight: [9, 10, 11],
  },
  {
    path: "services/checkout/src/charge.ts",
    startLine: 34,
    lang: "ts",
    lines: [
      "",
      "export async function charge(req: ChargeRequest) {",
      "  const key = keyFor(req.userId, req.intentId);",
      "  const chargeResult = await withIdempotency(key, () =>",
      "    stripe.paymentIntents.confirm(req.intentId, {",
      "      payment_method: req.paymentMethodId,",
      "    }),",
      "  );",
      "",
      "  // assumes chargeResult is a fresh Stripe response",
      "  if (chargeResult.status === 'succeeded') {",
      "    await ledger.record(req.userId, chargeResult.amount);",
      "  }",
      "  return chargeResult;",
      "}",
    ],
    highlight: [10, 11],
  },
  {
    path: "packages/core/src/store.ts",
    startLine: 12,
    lang: "ts",
    lines: [
      "export interface Store {",
      "  get<T>(key: string): Promise<CacheEntry<T> | null>;",
      "  set<T>(key: string, entry: CacheEntry<T>): Promise<void>;",
      "}",
      "",
      "export const store: Store = redisStore();",
    ],
  },
];

export const GRAPH = {
  nodes: [
    { id: "app", label: "apps/web", x: 0.50, y: 0.15, group: "app", size: 22, summary: "Next.js app. Entry point at app/layout.tsx." },
    { id: "api", label: "services/api", x: 0.22, y: 0.32, group: "svc", size: 20, summary: "GraphQL gateway. Federates checkout, catalog, auth." },
    { id: "checkout", label: "services/checkout", x: 0.32, y: 0.58, group: "svc", size: 22, summary: "Handles Stripe intents, idempotency, ledger writes." },
    { id: "catalog", label: "services/catalog", x: 0.72, y: 0.52, group: "svc", size: 18, summary: "Product + inventory reads, Postgres-backed." },
    { id: "auth", label: "services/auth", x: 0.13, y: 0.76, group: "svc", size: 18, summary: "JWT issue/refresh, OAuth callbacks." },
    { id: "queue", label: "services/queue", x: 0.54, y: 0.82, group: "svc", size: 16, summary: "Redis-backed jobs, retry with exponential backoff." },
    { id: "core", label: "packages/core", x: 0.50, y: 0.42, group: "pkg", size: 24, summary: "Shared primitives: store, logger, tracer." },
    { id: "ui", label: "packages/ui", x: 0.78, y: 0.25, group: "pkg", size: 18, summary: "Design system components." },
    { id: "sdk", label: "packages/sdk", x: 0.88, y: 0.78, group: "pkg", size: 16, summary: "Public JS SDK, re-exports typed clients." },
    { id: "infra", label: "infra/terraform", x: 0.08, y: 0.18, group: "infra", size: 14, summary: "AWS provisioning for services and queues." },
  ],
  edges: [
    ["app","api"],["app","ui"],["app","core"],
    ["api","checkout"],["api","catalog"],["api","auth"],["api","core"],
    ["checkout","core"],["checkout","queue"],["catalog","core"],
    ["auth","core"],["queue","core"],
    ["sdk","api"],["sdk","ui"],
    ["infra","api"],["infra","checkout"],["infra","queue"],
  ],
};

export const TREE = [
  { type: "dir", name: "apps", children: [
    { type: "dir", name: "web", children: [
      { type: "file", name: "layout.tsx", size: "2.1 KB", updated: "2d" },
      { type: "file", name: "page.tsx", size: "1.4 KB", updated: "2d" },
      { type: "dir", name: "checkout", children: [
        { type: "file", name: "page.tsx", size: "4.8 KB", updated: "3h" },
        { type: "file", name: "review.tsx", size: "3.2 KB", updated: "3h" },
      ]},
    ]},
  ]},
  { type: "dir", name: "services", open: true, children: [
    { type: "dir", name: "checkout", open: true, children: [
      { type: "file", name: "charge.ts", size: "1.9 KB", updated: "1h", hot: true },
      { type: "file", name: "idempotency.ts", size: "1.1 KB", updated: "1h", hot: true, active: true },
      { type: "file", name: "ledger.ts", size: "2.4 KB", updated: "2d" },
      { type: "file", name: "types.ts", size: "0.8 KB", updated: "1w" },
    ]},
    { type: "dir", name: "api", children: [
      { type: "file", name: "schema.graphql", size: "18 KB", updated: "2d" },
      { type: "file", name: "resolvers.ts", size: "9.3 KB", updated: "1d" },
    ]},
    { type: "dir", name: "auth", children: [
      { type: "file", name: "jwt.ts", size: "3.1 KB", updated: "1w" },
      { type: "file", name: "refresh.ts", size: "2.2 KB", updated: "1w" },
    ]},
    { type: "dir", name: "queue", children: [
      { type: "file", name: "worker.ts", size: "4.4 KB", updated: "3d" },
    ]},
  ]},
  { type: "dir", name: "packages", children: [
    { type: "dir", name: "core", children: [
      { type: "file", name: "store.ts", size: "0.9 KB", updated: "2w" },
      { type: "file", name: "logger.ts", size: "1.2 KB", updated: "2w" },
    ]},
    { type: "dir", name: "ui", children: [
      { type: "file", name: "Button.tsx", size: "1.1 KB", updated: "3w" },
    ]},
  ]},
  { type: "dir", name: "infra", children: [
    { type: "file", name: "main.tf", size: "6.2 KB", updated: "1w" },
  ]},
];

export const INSIGHTS = {
  summary: "Acme is a Turbo-monorepo for an e-commerce platform: a Next.js storefront talks to a GraphQL gateway that federates checkout, catalog and auth services. Background work runs through a Redis-backed queue. Shared primitives live in packages/core.",
  stack: [
    { name: "TypeScript", share: 78, color: "#3178C6" },
    { name: "Go", share: 11, color: "#00ADD8" },
    { name: "SQL", share: 6, color: "#E38C00" },
    { name: "Terraform", share: 5, color: "#7B42BC" },
  ],
  frameworks: ["Next.js 14", "GraphQL Yoga", "Prisma", "Stripe", "Redis", "PostgreSQL", "Terraform", "Vitest"],
  entries: [
    { file: "apps/web/app/layout.tsx", role: "Web app root" },
    { file: "services/api/src/server.ts", role: "GraphQL gateway" },
    { file: "services/checkout/src/index.ts", role: "Checkout service" },
    { file: "services/queue/src/worker.ts", role: "Background worker" },
  ],
  issues: [
    { level: "warn", title: "Idempotency cache returns non-2xx responses", file: "services/checkout/src/idempotency.ts", line: 92 },
    { level: "warn", title: "Unused export: `computeTaxBreakdown`", file: "packages/core/src/tax.ts", line: 14 },
    { level: "info", title: "Circular import risk: core ↔ logger", file: "packages/core/src/logger.ts", line: 3 },
    { level: "danger", title: "Secret-looking literal in test fixture", file: "services/auth/test/fixtures.ts", line: 22 },
  ],
  hotspots: [
    { file: "services/checkout/src/charge.ts", changes: 38, contributors: 6 },
    { file: "services/api/src/resolvers.ts", changes: 31, contributors: 8 },
    { file: "apps/web/checkout/page.tsx", changes: 24, contributors: 4 },
    { file: "services/auth/src/jwt.ts", changes: 12, contributors: 3 },
  ],
};
