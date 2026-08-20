import { PrismaClient } from "../generated/prisma/index.js";
import { PrismaNeon } from "@prisma/adapter-neon";

const globalForPrisma = globalThis;

// Neon's serverless driver talks to Postgres over HTTP/WebSocket instead of
// a held-open TCP connection — the right fit for Vercel's serverless
// functions, which can't rely on a long-lived connection pool the way a
// traditional server can.
const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL });

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
