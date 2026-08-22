import { PrismaClient } from "../generated/prisma/index.js";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";

const globalForPrisma = globalThis;

// Neon's serverless driver talks to Postgres over HTTP/WebSocket instead of
// a held-open TCP connection — the right fit for Vercel's serverless
// functions, which can't rely on a long-lived connection pool the way a
// traditional server can. Node.js has no built-in WebSocket client (only
// browsers/edge runtimes do), so it needs an explicit implementation —
// without this, queries fail with "All attempts to open a WebSocket...
// failed" (hit for real running the scheduled sync on a GitHub Actions
// runner; didn't surface in local dev, apparently masked there).
neonConfig.webSocketConstructor = ws;

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL });

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
