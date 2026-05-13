import * as cheerio from "cheerio";

export interface ScrapedContact {
  emails: string[];
  phones: string[];
  whatsapp: string | null;
  instagram: string | null;
}

// Páginas comunes donde los negocios ponen info de contacto
const CONTACT_PATHS = ["/contacto", "/contact", "/about", "/nosotros", "/sobre-nosotros"];

const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const PHONE_REGEX = /(?:\+54|0)?(?:11|15)?\s?[\d\s-]{6,12}/g;
const WHATSAPP_REGEX = /(?:wa\.me|api\.whatsapp\.com\/send\?phone=)[\d\/+]+/g;
const INSTAGRAM_REGEX = /(?:instagram\.com|instagr\.am)\/([a-zA-Z0-9_.]+)/g;

// Dominios de email a ignorar (no son emails de contacto del negocio)
const IGNORED_EMAIL_DOMAINS = [
  "example.com",
  "sentry.io",
  "wixpress.com",
  "googleapis.com",
  "w3.org",
  "schema.org",
  "facebook.com",
  "twitter.com",
  "google.com",
  "wordpress.org",
];

/**
 * Intenta extraer info de contacto (email, teléfono, WhatsApp, Instagram)
 * del sitio web de un negocio.
 */
export async function scrapeContactInfo(
  websiteUrl: string
): Promise<ScrapedContact> {
  const result: ScrapedContact = {
    emails: [],
    phones: [],
    whatsapp: null,
    instagram: null,
  };

  try {
    // Primero scrapear la página principal
    const mainPageData = await fetchPage(websiteUrl);
    if (mainPageData) {
      extractContactData(mainPageData, result);
    }

    // Si no encontramos email, intentar con páginas de contacto
    if (result.emails.length === 0) {
      for (const path of CONTACT_PATHS) {
        try {
          const baseUrl = new URL(websiteUrl).origin;
          const contactData = await fetchPage(`${baseUrl}${path}`);
          if (contactData) {
            extractContactData(contactData, result);
            if (result.emails.length > 0) break; // encontramos algo, salimos
          }
        } catch {
          // path no existe, seguimos con el siguiente
        }
      }
    }
  } catch (error) {
    console.error(`Error scrapeando ${websiteUrl}:`, error);
  }

  // Deduplicar
  result.emails = [...new Set(result.emails)];
  result.phones = [...new Set(result.phones)];

  return result;
}

async function fetchPage(url: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000); // 5 segundos timeout

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
    });

    clearTimeout(timeout);

    if (!response.ok) return null;

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("text/html")) return null;

    return await response.text();
  } catch {
    return null;
  }
}

function extractContactData(html: string, result: ScrapedContact): void {
  const $ = cheerio.load(html);

  // Extraer texto visible + contenido de links
  const bodyText = $("body").text();
  const allHrefs = $("a")
    .map((_i, el) => $(el).attr("href") || "")
    .get()
    .join(" ");

  const fullText = bodyText + " " + allHrefs;

  // Emails
  const emailMatches = fullText.match(EMAIL_REGEX) || [];
  for (const email of emailMatches) {
    const domain = email.split("@")[1]?.toLowerCase();
    if (domain && !IGNORED_EMAIL_DOMAINS.some((d) => domain.includes(d))) {
      result.emails.push(email.toLowerCase());
    }
  }

  // WhatsApp - buscar en links
  const waMatches = allHrefs.match(WHATSAPP_REGEX);
  if (waMatches && waMatches.length > 0) {
    result.whatsapp = waMatches[0];
  }

  // También buscar links con "wa.me" directamente
  $('a[href*="wa.me"], a[href*="whatsapp.com"]').each((_i, el) => {
    const href = $(el).attr("href");
    if (href && !result.whatsapp) {
      result.whatsapp = href;
    }
  });

  // Instagram
  const igMatches = fullText.match(INSTAGRAM_REGEX);
  if (igMatches && igMatches.length > 0) {
    // Extraer username del match
    const match = igMatches[0].match(/(?:instagram\.com|instagr\.am)\/([a-zA-Z0-9_.]+)/);
    if (match && match[1]) {
      result.instagram = `@${match[1]}`;
    }
  }

  // Teléfonos - buscar en links tel: y en texto
  $('a[href^="tel:"]').each((_i, el) => {
    const href = $(el).attr("href")?.replace("tel:", "").trim();
    if (href) {
      result.phones.push(href);
    }
  });

  // Si no encontramos tel: links, buscar en texto (menos confiable)
  if (result.phones.length === 0) {
    const phoneMatches = bodyText.match(PHONE_REGEX) || [];
    for (const phone of phoneMatches) {
      const cleaned = phone.replace(/[\s-]/g, "");
      if (cleaned.length >= 8 && cleaned.length <= 15) {
        result.phones.push(cleaned);
      }
    }
  }
}
