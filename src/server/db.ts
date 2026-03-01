import { PrismaClient } from "~/generated/prisma";

function createPrismaClient() {
  const url = process.env.DATABASE_URL ?? "file:./dev.db";

  // Turso production path
  if (url.startsWith("libsql://") || url.startsWith("http")) {
    // Lazy import to avoid bundling in dev
    const { PrismaLibSQL } = require("@prisma/adapter-libsql") as typeof import("@prisma/adapter-libsql");
    const { createClient } = require("@libsql/client") as typeof import("@libsql/client");
    const libsql = createClient({
      url,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
    const adapter = new PrismaLibSQL(libsql);
    return new PrismaClient({
      adapter,
      log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    } as ConstructorParameters<typeof PrismaClient>[0]);
  }

  // Local SQLite path
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });
}

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined;
};

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
