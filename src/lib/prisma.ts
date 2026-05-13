import { PrismaClient } from "@/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neon } from "@neondatabase/serverless";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  const sql = neon("postgresql://neondb_owner:npg_LoUjNfKta8A4@ep-delicate-band-ap163792-pooler.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require");
  const adapter = new PrismaNeon(sql as any);
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
