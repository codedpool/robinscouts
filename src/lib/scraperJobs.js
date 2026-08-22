import { prisma } from "./db.js";

// Persists in-progress "add a company" scraper builds so status polls work
// correctly across separate serverless invocations, which may not share
// any process memory with each other or with the invocation that created
// the build. Replaces an earlier in-memory Map that only ever worked on a
// single persistent Node process.
export async function createBuild({ sessionId, sourceKey, company, url, collectorId }) {
  return prisma.scraperBuild.create({
    data: { sessionId, sourceKey, company, url, collectorId, status: "running" },
  });
}

export async function updateBuild(id, patch) {
  return prisma.scraperBuild.update({ where: { id }, data: patch });
}

export async function getBuild(id) {
  return prisma.scraperBuild.findUnique({ where: { id } });
}
