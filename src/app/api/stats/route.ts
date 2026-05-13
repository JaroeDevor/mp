import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

// GET /api/stats - Métricas para el dashboard
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "No autorizado" }, { status: 401 });

  const [
    totalProspects,
    pending,
    approved,
    sent,
    replied,
    clients,
    discarded,
  ] = await Promise.all([
    prisma.prospect.count(),
    prisma.prospect.count({ where: { status: "PENDING" } }),
    prisma.prospect.count({ where: { status: "APPROVED" } }),
    prisma.prospect.count({ where: { status: "SENT" } }),
    prisma.prospect.count({ where: { status: "REPLIED" } }),
    prisma.prospect.count({ where: { status: "CLIENT" } }),
    prisma.prospect.count({ where: { status: "DISCARDED" } }),
  ]);

  // Prospectos de esta semana
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const [newThisWeek, sentThisWeek] = await Promise.all([
    prisma.prospect.count({
      where: { foundAt: { gte: oneWeekAgo } },
    }),
    prisma.prospect.count({
      where: { status: "SENT", lastContactedAt: { gte: oneWeekAgo } },
    }),
  ]);

  // Score promedio
  const avgScore = await prisma.prospect.aggregate({
    _avg: { score: true },
  });

  // Tasa de respuesta
  const responseRate =
    sent + replied + clients > 0
      ? Math.round(((replied + clients) / (sent + replied + clients)) * 100)
      : 0;

  return Response.json({
    totalProspects,
    pending,
    approved,
    sent,
    replied,
    clients,
    discarded,
    newThisWeek,
    sentThisWeek,
    avgScore: Math.round(avgScore._avg.score || 0),
    responseRate,
    funnel: {
      found: totalProspects,
      approved: approved + sent + replied + clients,
      sent: sent + replied + clients,
      replied: replied + clients,
      clients,
    },
  });
}
