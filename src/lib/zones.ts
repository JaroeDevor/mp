export interface ZoneConfig {
  id: string;
  name: string;
  zone: "CABA" | "ZONA_NORTE";
  latitude: number;
  longitude: number;
  radiusMeters: number;
}

export const DEFAULT_ZONES: ZoneConfig[] = [
  // CABA
  {
    id: "palermo",
    name: "Palermo",
    zone: "CABA",
    latitude: -34.5875,
    longitude: -58.424,
    radiusMeters: 3000,
  },
  {
    id: "belgrano",
    name: "Belgrano",
    zone: "CABA",
    latitude: -34.5625,
    longitude: -58.4566,
    radiusMeters: 2500,
  },
  {
    id: "villa-crespo",
    name: "Villa Crespo",
    zone: "CABA",
    latitude: -34.5986,
    longitude: -58.438,
    radiusMeters: 2000,
  },
  {
    id: "recoleta",
    name: "Recoleta",
    zone: "CABA",
    latitude: -34.5889,
    longitude: -58.3938,
    radiusMeters: 2000,
  },
  {
    id: "caballito",
    name: "Caballito",
    zone: "CABA",
    latitude: -34.6197,
    longitude: -58.4477,
    radiusMeters: 2500,
  },
  {
    id: "nunez",
    name: "Núñez",
    zone: "CABA",
    latitude: -34.5453,
    longitude: -58.4567,
    radiusMeters: 2000,
  },
  {
    id: "colegiales",
    name: "Colegiales",
    zone: "CABA",
    latitude: -34.5744,
    longitude: -58.4493,
    radiusMeters: 1500,
  },
  // Zona Norte
  {
    id: "vicente-lopez",
    name: "Vicente López",
    zone: "ZONA_NORTE",
    latitude: -34.5283,
    longitude: -58.484,
    radiusMeters: 3000,
  },
  {
    id: "olivos",
    name: "Olivos",
    zone: "ZONA_NORTE",
    latitude: -34.5114,
    longitude: -58.4916,
    radiusMeters: 2500,
  },
  {
    id: "martinez",
    name: "Martínez / Acassuso",
    zone: "ZONA_NORTE",
    latitude: -34.4918,
    longitude: -58.5076,
    radiusMeters: 3000,
  },
  {
    id: "san-isidro",
    name: "San Isidro",
    zone: "ZONA_NORTE",
    latitude: -34.4708,
    longitude: -58.5279,
    radiusMeters: 4000,
  },
  {
    id: "tigre",
    name: "Tigre",
    zone: "ZONA_NORTE",
    latitude: -34.426,
    longitude: -58.5796,
    radiusMeters: 5000,
  },
];

// Rubros sugeridos para buscar
export const DEFAULT_QUERIES = [
  "tienda de ropa",
  "librería",
  "pet shop",
  "dietética",
  "florería",
  "panadería",
  "juguetería",
  "bazar",
  "vinoteca",
  "tienda de accesorios",
  "regalería",
  "perfumería",
  "tienda de decoración",
  "zapatos",
  "joyería",
  "tienda de cosméticos",
];

export function getZoneById(id: string): ZoneConfig | undefined {
  return DEFAULT_ZONES.find((z) => z.id === id);
}

export function getZonesByArea(area: "CABA" | "ZONA_NORTE"): ZoneConfig[] {
  return DEFAULT_ZONES.filter((z) => z.zone === area);
}
