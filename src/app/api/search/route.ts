import { type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { searchBusinesses, getPlaceDetails } from "@/lib/google-places";
import { scrapeContactInfo } from "@/lib/email-scraper";
import { calculateScore } from "@/lib/scoring";
import { generateEmail } from "@/lib/gemini";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

// POST /api/search - Ejecutar una búsqueda manual
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "No autorizado" }, { status: 401 });

  const body = await request.json();
  const { query, latitude, longitude, radiusMeters, zone, subZone } = body;

  if (!query || !latitude || !longitude) {
    return Response.json(
      { error: "query, latitude y longitude son requeridos" },
      { status: 400 }
    );
  }

  try {
    // 1. Buscar negocios en Google Places
    const places = await searchBusinesses(
      query,
      latitude,
      longitude,
      radiusMeters || 3000,
      20
    );

    let created = 0;
    let skipped = 0;
    const results = [];

    for (const place of places) {
      // 2. Verificar si ya existe (deduplicación por placeId)
      const existing = await prisma.prospect.findUnique({
        where: { placeId: place.placeId },
      });

      if (existing) {
        skipped++;
        continue;
      }

      // 3. Obtener detalles (website, teléfono)
      const details = await getPlaceDetails(place.placeId);
      await sleep(200); // rate limiting

      // 4. Scrapear contacto del sitio web
      let contactInfo = { emails: [] as string[], phones: [] as string[], whatsapp: null as string | null, instagram: null as string | null };
      let websiteText = "";

      if (details.website) {
        try {
          contactInfo = await scrapeContactInfo(details.website);
          // Obtener texto para scoring
          const res = await fetch(details.website, {
            signal: AbortSignal.timeout(5000),
            headers: { "User-Agent": "Mozilla/5.0" },
          }).catch(() => null);
          if (res?.ok) {
            websiteText = await res.text().catch(() => "");
          }
        } catch {
          // sitio no accesible, seguimos
        }
      }

      // Usar teléfono de Places si no encontramos en la web
      const phone = contactInfo.phones[0] || details.phone || null;

      // 5. Calcular score
      const scoreResult = calculateScore({
        hasEmail: contactInfo.emails.length > 0,
        hasPhone: !!phone,
        hasWhatsapp: !!contactInfo.whatsapp,
        hasWebsite: !!details.website,
        hasInstagram: !!contactInfo.instagram,
        categories: place.types,
        websiteText,
        isInOperativeZone: true,
      });

      // 6. Guardar prospecto
      const prospect = await prisma.prospect.create({
        data: {
          businessName: place.name,
          category: query,
          email: contactInfo.emails[0] || null,
          phone,
          whatsapp: contactInfo.whatsapp,
          instagram: contactInfo.instagram,
          website: details.website || null,
          address: place.address,
          zone: zone || "CABA",
          subZone: subZone || null,
          source: "GOOGLE_PLACES",
          placeId: place.placeId,
          score: scoreResult.total,
          status: "PENDING",
        },
      });

      // 7. Generar borrador de mail si tiene email
      if (prospect.email) {
        try {
          const emailDraft = await generateEmail({
            businessName: prospect.businessName,
            category: prospect.category,
            zone: prospect.zone,
            subZone: prospect.subZone,
            website: prospect.website,
          });

          await prisma.emailDraft.create({
            data: {
              prospectId: prospect.id,
              subject: emailDraft.subject,
              body: emailDraft.body,
              templateUsed: emailDraft.templateUsed,
            },
          });

          // Rate limit para Gemini (15 RPM)
          await sleep(4500);
        } catch (err) {
          console.error(`Error generando mail para ${prospect.businessName}:`, err);
        }
      }

      created++;
      results.push({
        name: prospect.businessName,
        score: prospect.score,
        hasEmail: !!prospect.email,
        hasPhone: !!prospect.phone,
        hasWhatsapp: !!prospect.whatsapp,
      });
    }

    return Response.json({
      message: `Búsqueda completada: ${created} nuevos, ${skipped} duplicados`,
      created,
      skipped,
      total: places.length,
      results,
    });
  } catch (error) {
    console.error("Error en búsqueda:", error);
    return Response.json(
      { error: "Error ejecutando la búsqueda" },
      { status: 500 }
    );
  }
}

// GET /api/search - Obtener configuraciones de búsqueda guardadas
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "No autorizado" }, { status: 401 });

  const configs = await prisma.searchConfig.findMany({
    orderBy: { createdAt: "desc" },
  });
  return Response.json(configs);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
