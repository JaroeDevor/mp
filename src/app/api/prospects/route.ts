import { type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

// GET /api/prospects - Lista de prospectos con filtros
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "No autorizado" }, { status: 401 });

  const searchParams = request.nextUrl.searchParams;

  const status = searchParams.get("status");
  const zone = searchParams.get("zone");
  const minScore = searchParams.get("minScore");
  const category = searchParams.get("category");
  const sortBy = searchParams.get("sortBy") || "score";
  const order = searchParams.get("order") || "desc";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "50");

  const where: Record<string, unknown> = {};

  if (status) where.status = status;
  if (zone) where.zone = zone;
  if (minScore) where.score = { gte: parseInt(minScore) };
  if (category) where.category = { contains: category };

  const [prospects, total] = await Promise.all([
    prisma.prospect.findMany({
      where,
      orderBy: { [sortBy]: order },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        emailDrafts: {
          orderBy: { generatedAt: "desc" },
          take: 1,
        },
      },
    }),
    prisma.prospect.count({ where }),
  ]);

  return Response.json({
    prospects,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}
