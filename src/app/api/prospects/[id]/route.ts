import { type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

// GET /api/prospects/[id] - Detalle de un prospecto
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;

  const prospect = await prisma.prospect.findUnique({
    where: { id },
    include: {
      emailDrafts: { orderBy: { generatedAt: "desc" } },
      assignedTo: { select: { id: true, name: true, email: true } },
    },
  });

  if (!prospect) {
    return Response.json({ error: "Prospecto no encontrado" }, { status: 404 });
  }

  return Response.json(prospect);
}

// PATCH /api/prospects/[id] - Actualizar estado, notas, etc.
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();

  const allowedFields = [
    "status", "notes", "assignedToId", "email",
    "phone", "whatsapp", "instagram", "businessName", "category",
  ];

  const data: Record<string, unknown> = {};
  for (const field of allowedFields) {
    if (field in body) data[field] = body[field];
  }

  // Si se marca como SENT, registrar fecha de contacto
  if (data.status === "SENT") {
    data.lastContactedAt = new Date();
  }

  const updated = await prisma.prospect.update({
    where: { id },
    data,
    include: {
      emailDrafts: { orderBy: { generatedAt: "desc" }, take: 1 },
    },
  });

  return Response.json(updated);
}

// DELETE /api/prospects/[id]
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;

  await prisma.prospect.delete({ where: { id } });

  return Response.json({ ok: true });
}
