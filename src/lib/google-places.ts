// Wrapper usando Overpass API (OpenStreetMap) como alternativa 100% gratuita
// No requiere tarjeta de crédito ni API Keys.

export interface PlaceResult {
  placeId: string;
  name: string;
  address: string;
  website?: string;
  phone?: string;
  types: string[];
  latitude: number;
  longitude: number;
}

const detailsCache = new Map<string, { website?: string; phone?: string }>();

/**
 * Busca negocios geográficos usando OpenStreetMap.
 * Ignora la variable de entorno de Google y usa datos libres.
 */
export async function searchBusinesses(
  query: string,
  latitude: number,
  longitude: number,
  radiusMeters: number,
  maxResults: number = 40
): Promise<PlaceResult[]> {
  // Buscamos cualquier tipo de tienda o comercio (shop) y amenidades comunes de negocios
  const overpassQuery = `[out:json];
(
  node["shop"](around:${radiusMeters},${latitude},${longitude});
  node["amenity"~"cafe|restaurant|bar|fast_food|clinic|dentist|pharmacy|veterinary|gym"](around:${radiusMeters},${latitude},${longitude});
);
out body ${maxResults};`;

  const url = "https://overpass-api.de/api/interpreter";
  
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "MotoProspect/1.0"
      },
      body: "data=" + encodeURIComponent(overpassQuery)
    });

    if (!response.ok) {
      console.error(`Overpass API error: ${response.statusText}`);
      return [];
    }

    const data = await response.json();
    const results: PlaceResult[] = [];

    for (const element of data.elements) {
      if (!element.tags || !element.tags.name) continue; // Ignorar lugares sin nombre

      const tags = element.tags;
      const placeId = element.id.toString();
      
      let address = "";
      if (tags["addr:street"] && tags["addr:housenumber"]) {
        address = `${tags["addr:street"]} ${tags["addr:housenumber"]}`;
        if (tags["addr:city"]) address += `, ${tags["addr:city"]}`;
      } else {
        address = "Dirección no especificada";
      }

      const website = tags["website"] || tags["contact:website"];
      const phone = tags["phone"] || tags["contact:phone"];

      // Guardamos en memoria para cuando nos pidan los detalles
      detailsCache.set(placeId, { website, phone });

      results.push({
        placeId,
        name: tags.name,
        address,
        types: [tags["shop"] || tags["amenity"] || "negocio"],
        latitude: element.lat,
        longitude: element.lon,
      });
    }

    return results;
  } catch (err) {
    console.error("Error conectando a Overpass API:", err);
    return [];
  }
}

/**
 * Obtiene detalles de un negocio. En este caso los sacamos de la caché en memoria 
 * que poblamos durante la búsqueda inicial.
 */
export async function getPlaceDetails(
  placeId: string
): Promise<{ website?: string; phone?: string }> {
  const details = detailsCache.get(placeId);
  if (details) {
    detailsCache.delete(placeId); // Limpiar memoria
    return details;
  }
  return {};
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
