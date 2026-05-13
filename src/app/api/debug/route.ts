import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export async function GET() {
  const results: Record<string, unknown> = {};

  // 1. Check env var
  results.hasDbUrl = !!process.env.DATABASE_URL;
  results.dbUrlPreview = process.env.DATABASE_URL
    ? process.env.DATABASE_URL.substring(0, 30) + "..."
    : "NOT SET";

  // 2. Try direct neon() connection
  try {
    const sql = neon(
      "postgresql://neondb_owner:npg_LoUjNfKta8A4@ep-delicate-band-ap163792-pooler.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require"
    );
    const res = await sql`SELECT COUNT(*) as count FROM "User"`;
    results.dbConnection = "OK";
    results.userCount = res[0]?.count;
  } catch (err: unknown) {
    results.dbConnection = "FAILED";
    results.dbError = err instanceof Error ? err.message : String(err);
  }

  // 3. Try prisma
  try {
    const { prisma } = await import("@/lib/prisma");
    const users = await prisma.user.findMany({ select: { email: true } });
    results.prismaConnection = "OK";
    results.prismaUsers = users;
  } catch (err: unknown) {
    results.prismaConnection = "FAILED";
    results.prismaError = err instanceof Error ? err.message : String(err);
  }

  return NextResponse.json(results);
}
