import { type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "No autorizado" }, { status: 401 });

  const configs = await prisma.searchConfig.findMany({
    orderBy: { createdAt: "desc" },
  });
  return Response.json(configs);
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "No autorizado" }, { status: 401 });

  const body = await request.json();
  const { query, zone, subZone, latitude, longitude, radiusMeters } = body;

  const config = await prisma.searchConfig.create({
    data: {
      query,
      zone,
      subZone,
      latitude,
      longitude,
      radiusMeters: radiusMeters || 3000,
      active: true,
    },
  });

  return Response.json(config);
}
