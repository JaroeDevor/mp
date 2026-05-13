import { PrismaClient } from "@/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";

neonConfig.webSocketConstructor = ws;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  // Hardcoded to prevent Next.js/Vercel static parsing bugs
  const url = "postgresql://neondb_owner:npg_LoUjNfKta8A4@ep-delicate-band-ap163792-pooler.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";
  const pool = new Pool({ connectionString: url });
  const adapter = new PrismaNeon(pool as any);
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
