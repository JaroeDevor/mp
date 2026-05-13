import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

interface ProspectForEmail {
  businessName: string;
  category: string;
  zone: string;
  subZone?: string | null;
  website?: string | null;
}

interface GeneratedEmail {
  subject: string;
  body: string;
  templateUsed: string;
}

// Templates base por tipo de negocio
function getTemplateHint(category: string): string {
  const lower = category.toLowerCase();
  if (lower.includes("ropa") || lower.includes("clothing") || lower.includes("shoe"))
    return "moda-envios";
  if (lower.includes("libro") || lower.includes("book"))
    return "libreria-entregas";
  if (lower.includes("pet") || lower.includes("mascota"))
    return "pet-shop";
  if (lower.includes("flor") || lower.includes("florist"))
    return "floreria-urgente";
  if (lower.includes("bakery") || lower.includes("panaderia"))
    return "gastronomia";
  return "generico";
}

/**
 * Genera un mail personalizado para un prospecto usando Gemini.
 * Incluye rate limiting (espera 1s entre llamadas).
 */
export async function generateEmail(
  prospect: ProspectForEmail
): Promise<GeneratedEmail> {
  const templateUsed = getTemplateHint(prospect.category);

  const prompt = `Sos un redactor comercial argentino que escribe mails de prospección para un servicio de motomensajería en Buenos Aires. 

El servicio ofrece:
- Envíos en el día dentro de CABA y Zona Norte
- Retiros y entregas puerta a puerta
- Precios competitivos sin comisiones
- Atención personalizada (no es una app, es trato directo)

Datos del prospecto:
- Nombre del negocio: ${prospect.businessName}
- Rubro: ${prospect.category}
- Zona: ${prospect.subZone || prospect.zone}

Escribí un mail de prospección personalizado con estas reglas:
1. Asunto corto y directo (máximo 8 palabras), sin emojis
2. Saludo usando el nombre del negocio
3. Propuesta de valor específica para su rubro (no genérica)
4. Máximo 4-5 oraciones en el cuerpo
5. Tono profesional pero cercano, argentino (voseo)
6. Cerrar con una pregunta abierta que invite a responder
7. No uses frases genéricas como "me comunico con ustedes" o "nos ponemos a disposición"
8. No inventes datos del negocio que no tenés

Respondé SOLO con un JSON así (sin markdown, sin backticks):
{"subject": "...", "body": "..."}`;

  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();

  // Limpiar posibles backticks o markdown del response
  const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

  try {
    const parsed = JSON.parse(cleaned);
    return {
      subject: parsed.subject,
      body: parsed.body,
      templateUsed,
    };
  } catch {
    // Fallback si Gemini no devuelve JSON válido
    return {
      subject: `Servicio de mensajería para ${prospect.businessName}`,
      body: `Hola ${prospect.businessName},\n\nSomos un servicio de motomensajería en ${prospect.subZone || prospect.zone}. Ofrecemos envíos en el día, retiro y entrega puerta a puerta a precios accesibles.\n\n¿Te interesaría que te contemos cómo podemos ayudarte con tus envíos?`,
      templateUsed: "fallback",
    };
  }
}

/**
 * Genera mails para un lote de prospectos con delay entre cada uno
 * para respetar el rate limit de Gemini (15 RPM free tier).
 */
export async function generateEmailBatch(
  prospects: ProspectForEmail[]
): Promise<Map<string, GeneratedEmail>> {
  const results = new Map<string, GeneratedEmail>();

  for (const prospect of prospects) {
    try {
      const email = await generateEmail(prospect);
      results.set(prospect.businessName, email);
    } catch (error) {
      console.error(`Error generando mail para ${prospect.businessName}:`, error);
    }
    // 4.5 segundos de delay = ~13 requests por minuto (debajo del límite de 15)
    await new Promise((resolve) => setTimeout(resolve, 4500));
  }

  return results;
}
