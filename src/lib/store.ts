// ─────────────────────────────────────────────────────────────
// El Gazofilacio (v1.2): catálogo de la tienda de Siclos.
// Puro y compartido: el servidor cobra con él y el cliente pinta con él.
// Los precios nacen como fracciones del recorrido coronado (E ≈ 175 Siclos
// con la tabla actual de economy.ts) y se ajustan aquí, editando constantes,
// nunca con una migración (principio 4 del diseño: precios por datos).
// Nombres con base bíblica: el Gazofilacio (Lucas 21:1), la segunda
// comisión de Jonás (Jonás 3:1), la lámpara de la palabra (Salmo 119:105),
// el sol detenido de Josué (Josué 10:12-13).
// ─────────────────────────────────────────────────────────────

export type StoreKind = "bendicion" | "marco" | "titulo";

export interface StoreItem {
  /** Clave persistida en Purchase.item y Game.bendiciones. */
  key: string;
  name: string;
  kind: StoreKind;
  /** Precio fijo en Siclos; null cuando se cobra por tramos (Redención). */
  price: number | null;
  effect: string;
  /** Límite de uso por recorrido, o permanencia para los cosméticos. */
  limit: string;
  /** Base bíblica del nombre. */
  scripture: string;
}

// ── Bendiciones de partida: se ofrendan al usarlas, nunca desde la tienda ──
export const LAMPARA_PRICE = 10;
export const SOL_PRICE = 15;
export const SOL_SECONDS = 15;
export const SOL_MAX_USES = 3;

// ── Redención de Jonás: el precio sube con lo que está en juego ──
export const REDEMPTION_TIERS = [
  { minLevel: 2, maxLevel: 5, price: 45 },
  { minLevel: 6, maxLevel: 10, price: 90 },
  { minLevel: 11, maxLevel: 15, price: 150 },
] as const;

/** Precio de la Redención de Jonás según el escalón de la caída.
 *  null: la caída en el escalón 1 no admite Redención (el refugio es cero
 *  y reiniciar el camino es más rápido y gratuito). */
export function redencionPrice(level: number): number | null {
  for (const tier of REDEMPTION_TIERS)
    if (level >= tier.minLevel && level <= tier.maxLevel) return tier.price;
  return null;
}

export const STORE_ITEMS: StoreItem[] = [
  {
    key: "lampara",
    name: "Lámpara",
    kind: "bendicion",
    price: LAMPARA_PRICE,
    effect: "Revela la referencia bíblica del nivel antes de responder: dónde buscar, no qué responder.",
    limit: "1 por recorrido",
    scripture: "Salmo 119:105",
  },
  {
    key: "sol",
    name: "Sol de Josué",
    kind: "bendicion",
    price: SOL_PRICE,
    effect: `Suma ${SOL_SECONDS} segundos al reloj del nivel actual. En modo paz no hay tiempo que detener.`,
    limit: "Hasta 3 por recorrido",
    scripture: "Josué 10:12-13",
  },
  {
    key: "redencion",
    name: "Redención de Jonás",
    kind: "bendicion",
    price: null,
    effect: "Reabre una partida perdida: reintenta el nivel actual desde el refugio, con pregunta nueva.",
    limit: "1 por recorrido",
    scripture: "Jonás 3:1",
  },
  {
    key: "marco:cedro",
    name: "Marco de Cedro",
    kind: "marco",
    price: 100,
    effect: "Marco permanente para tus iniciales, del justo que crece como cedro.",
    limit: "Permanente",
    scripture: "Salmo 92:12",
  },
  {
    key: "marco:onix",
    name: "Marco de Ónix",
    kind: "marco",
    price: 200,
    effect: "Marco permanente para tus iniciales, piedra del efod del sumo sacerdote.",
    limit: "Permanente",
    scripture: "Éxodo 28:9",
  },
  {
    key: "marco:zafiro",
    name: "Marco de Zafiro",
    kind: "marco",
    price: 300,
    effect: "Marco permanente para tus iniciales, zafiro del pectoral sacerdotal.",
    limit: "Permanente",
    scripture: "Éxodo 28:18",
  },
  {
    key: "titulo:bereano",
    name: "Bereano",
    kind: "titulo",
    price: 150,
    effect: "Tratamiento permanente junto a tu nombre en el Salón: escudriñaste las Escrituras cada día.",
    limit: "Permanente",
    scripture: "Hechos 17:11",
  },
  {
    key: "titulo:escriba",
    name: "Escriba fiel",
    kind: "titulo",
    price: 150,
    effect: "Tratamiento permanente junto a tu nombre en el Salón: corazón preparado para inquirir la ley.",
    limit: "Permanente",
    scripture: "Esdras 7:10",
  },
  {
    key: "titulo:salomon",
    name: "Sabiduría de Salomón",
    kind: "titulo",
    price: 150,
    effect: "Tratamiento permanente junto a tu nombre en el Salón. El nombre histórico del 50:50, honrando en lugar de confundir.",
    limit: "Permanente",
    scripture: "1 Reyes 4:29",
  },
];

export function storeItem(key: string): StoreItem | undefined {
  return STORE_ITEMS.find((item) => item.key === key);
}

/** Los cosméticos se compran y equipan desde la tienda; las bendiciones se
 *  ofrendan dentro de la partida y aquí solo se presentan. */
export function isCosmetic(key: string): boolean {
  const item = storeItem(key);
  return !!item && (item.kind === "marco" || item.kind === "titulo");
}
