import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// The MVP UI runs entirely on demo/local state (see lib/store) and never
// imports this file from a code path that renders without a database, so
// we only pay the connection cost when a future API route actually needs
// it. Keeping this lazy also means `npm run build` succeeds with no
// DATABASE_URL configured.

declare global {
  var prismaGlobal: PrismaClient | undefined;
}

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Configure a Postgres connection string before using the Prisma-backed repositories."
    );
  }
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}

export function getPrisma(): PrismaClient {
  if (!globalThis.prismaGlobal) {
    globalThis.prismaGlobal = createPrismaClient();
  }
  return globalThis.prismaGlobal;
}
