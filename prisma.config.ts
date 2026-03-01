import "dotenv/config";
import { defineConfig } from "prisma/config";

const url = process.env.DATABASE_URL ?? "file:./dev.db";
const isLibSQL = url.startsWith("libsql://") || url.startsWith("http");

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: isLibSQL
    ? {
        adapter: () => {
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          const { PrismaLibSQL } = require("@prisma/adapter-libsql") as typeof import("@prisma/adapter-libsql");
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          const { createClient } = require("@libsql/client") as typeof import("@libsql/client");
          const client = createClient({
            url,
            authToken: process.env.TURSO_AUTH_TOKEN,
          });
          return new PrismaLibSQL(client);
        },
      }
    : { url },
});
