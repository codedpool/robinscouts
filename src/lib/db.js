import path from "node:path";
import { PrismaClient } from "@/generated/prisma";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const globalForPrisma = globalThis;

// Computed explicitly (not from DATABASE_URL) so it always matches wherever
// this process's cwd is. prisma.config.ts resolves "file:./dev.db" relative
// to the project root too, so this must stay in sync with that, not with
// prisma/schema.prisma's directory.
const dbPath = path.join(process.cwd(), "dev.db");
const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
