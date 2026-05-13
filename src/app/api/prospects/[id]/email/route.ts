import { type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateEmail } from "@/lib/gemini";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

// POST /api/prospects/[id]/email - Generar o regenerar mail con IA
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;

  const prospect = await prisma.prospect.findUnique({ where: { id } });
  if (!prospect) {
    return Response.json({ error: "Prospecto no encontrado" }, { status: 404 });
  }

  try {
    const generated = await generateEmail({
      businessName: prospect.businessName,
      category: prospect.category,
      zone: prospect.zone,
      subZone: prospect.subZone,
      website: prospect.website,
    });

    const draft = await prisma.emailDraft.create({
      data: {
        prospectId: id,
        subject: generated.subject,
        body: generated.body,
        templateUsed: generated.templateUsed,
      },
    });

    return Response.json(draft);
  } catch (error) {
    console.error("Error generando email:", error);
    return Response.json(
      { error: "Error al generar el email con IA" },
      { status: 500 }
    );
  }
}

// PATCH /api/prospects/[id]/email - Editar un borrador existente
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();
  const { draftId, subject, body: emailBody } = body;

  if (!draftId) {
    return Response.json({ error: "draftId requerido" }, { status: 400 });
  }

  // Verificar que el draft pertenece al prospecto
  const draft = await prisma.emailDraft.findFirst({
    where: { id: draftId, prospectId: id },
  });

  if (!draft) {
    return Response.json({ error: "Borrador no encontrado" }, { status: 404 });
  }

  const updated = await prisma.emailDraft.update({
    where: { id: draftId },
    data: {
      ...(subject !== undefined && { subject }),
      ...(emailBody !== undefined && { body: emailBody }),
      edited: true,
    },
  });

  return Response.json(updated);
}
