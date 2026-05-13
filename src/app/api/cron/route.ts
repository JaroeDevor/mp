import { type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { searchBusinesses, getPlaceDetails } from "@/lib/google-places";
import { scrapeContactInfo } from "@/lib/email-scraper";
import { calculateScore } from "@/lib/scoring";
import { generateEmail } from "@/lib/gemini";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return Response.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const config = await prisma.searchConfig.findFirst({
      where: { active: true },
      orderBy: { lastRunAt: "asc" },
    });

    if (!config) {
      return Response.json({ message: "No hay configuraciones activas" });
    }

    console.log(`Ejecutando cron para: ${config.query} en ${config.subZone || config.zone}`);

    const places = await searchBusinesses(
      config.query,
      config.latitude,
      config.longitude,
      config.radiusMeters,
      10
    );

    let created = 0;
    
    for (const place of places) {
      if (created >= 5) break; // Límite de seguridad por timeout de Vercel

      const existing = await prisma.prospect.findUnique({
        where: { placeId: place.placeId },
      });

      if (existing) continue;

      const details = await getPlaceDetails(place.placeId);
      await sleep(200);

      let contactInfo = { emails: [] as string[], phones: [] as string[], whatsapp: null as string | null, instagram: null as string | null };
      let websiteText = "";

      if (details.website) {
        try {
          contactInfo = await scrapeContactInfo(details.website);
          const res = await fetch(details.website, {
            signal: AbortSignal.timeout(5000),
            headers: { "User-Agent": "Mozilla/5.0" },
          }).catch(() => null);
          if (res?.ok) websiteText = await res.text().catch(() => "");
        } catch {}
      }

      const phone = contactInfo.phones[0] || details.phone || null;

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

      const prospect = await prisma.prospect.create({
        data: {
          businessName: place.name,
          category: config.query,
          email: contactInfo.emails[0] || null,
          phone,
          whatsapp: contactInfo.whatsapp,
          instagram: contactInfo.instagram,
          website: details.website || null,
          address: place.address,
          zone: config.zone,
          subZone: config.subZone,
          source: "GOOGLE_PLACES_CRON",
          placeId: place.placeId,
          score: scoreResult.total,
          status: "PENDING",
        },
      });

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
          await sleep(4500); 
        } catch (err) {
          console.error("Error Gemini:", err);
        }
      }

      created++;
    }

    await prisma.searchConfig.update({
      where: { id: config.id },
      data: {
        lastRunAt: new Date(),
        prospectsFound: { increment: created },
      },
    });

    return Response.json({
      message: "Cron completado",
      configRun: config.query,
      newProspects: created,
    });

  } catch (error) {
    console.error("Error en cron:", error);
    return Response.json({ error: "Error ejecutando cron" }, { status: 500 });
  }
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
