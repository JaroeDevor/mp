/**
 * Calcula un score de 0-100 para un prospecto basado en criterios
 * que determinan qué tan buen cliente potencial es para motomensajería.
 */

export interface ScoreInput {
  hasEmail: boolean;
  hasPhone: boolean;
  hasWhatsapp: boolean;
  hasWebsite: boolean;
  hasInstagram: boolean;
  categories: string[];
  websiteText?: string;
  isInOperativeZone: boolean;
}

interface ScoreBreakdown {
  total: number;
  details: { criterion: string; points: number }[];
}

const PHYSICAL_PRODUCT_TYPES = [
  "clothing_store", "shoe_store", "jewelry_store", "book_store",
  "pet_store", "furniture_store", "home_goods_store", "hardware_store",
  "electronics_store", "florist", "bakery", "store", "liquor_store",
];

const DELIVERY_KEYWORDS = [
  "envío", "envios", "delivery", "despacho", "entrega",
  "envío a domicilio", "envío gratis", "enviamos",
];

const ECOMMERCE_KEYWORDS = [
  "carrito", "agregar al carrito", "add to cart", "comprar",
  "tiendanube", "mercadoshops", "shopify", "woocommerce", "checkout",
];

export function calculateScore(input: ScoreInput): ScoreBreakdown {
  const details: { criterion: string; points: number }[] = [];
  let total = 0;

  if (input.hasEmail) {
    details.push({ criterion: "Tiene email", points: 25 });
    total += 25;
  }
  if (input.hasPhone) {
    details.push({ criterion: "Tiene teléfono", points: 10 });
    total += 10;
  }
  if (input.hasWhatsapp) {
    details.push({ criterion: "Tiene WhatsApp", points: 8 });
    total += 8;
  }
  if (input.hasInstagram) {
    details.push({ criterion: "Tiene Instagram", points: 5 });
    total += 5;
  }

  const sellsPhysical = input.categories.some((cat) =>
    PHYSICAL_PRODUCT_TYPES.includes(cat)
  );
  if (sellsPhysical) {
    details.push({ criterion: "Vende productos físicos", points: 20 });
    total += 20;
  }

  if (input.websiteText) {
    const lower = input.websiteText.toLowerCase();
    if (DELIVERY_KEYWORDS.some((kw) => lower.includes(kw))) {
      details.push({ criterion: "Menciona envíos/delivery", points: 15 });
      total += 15;
    }
    if (ECOMMERCE_KEYWORDS.some((kw) => lower.includes(kw))) {
      details.push({ criterion: "Tiene e-commerce", points: 12 });
      total += 12;
    }
  }

  if (input.hasWebsite) {
    details.push({ criterion: "Tiene sitio web", points: 10 });
    total += 10;
  }
  if (input.isInOperativeZone) {
    details.push({ criterion: "En zona operativa", points: 5 });
    total += 5;
  }

  total = Math.min(total, 100);
  return { total, details };
}

export function getScoreColor(score: number): string {
  if (score >= 70) return "green";
  if (score >= 40) return "yellow";
  return "red";
}

export function getScoreLabel(score: number): string {
  if (score >= 70) return "Alto potencial";
  if (score >= 40) return "Potencial medio";
  return "Bajo potencial";
}
