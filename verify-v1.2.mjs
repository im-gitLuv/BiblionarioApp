#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// Verificador de la v1.2 «El Gazofilacio» — Biblionario.
// Comprueba que el parche v1.2 esté aplicado en el repositorio actual:
// migración aditiva, catálogo de la tienda, cobros atómicos del servidor,
// Redención de Jonás, pantallas y pruebas. Uso:
//     node verify-v1.2.mjs            (desde download/, junto al repo o dentro)
// El script localiza el repositorio: si junto al script hay un directorio con
// prisma/schema.prisma lo usa; si no, usa el directorio de trabajo actual.
// Sale con código 0 si todo lo crítico pasa; 1 si falta algo crítico.
// ─────────────────────────────────────────────────────────────────────────────
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const aqui = dirname(fileURLToPath(import.meta.url));
const root = existsSync(join(aqui, 'prisma', 'schema.prisma')) ? aqui : process.cwd();
const read = (...parts) => {
  try { return readFileSync(join(root, ...parts), 'utf8'); } catch { return ''; }
};

let fails = 0;
let warns = 0;
const ok = (label) => console.log('  ✔', label);
const bad = (label) => { console.log('  ✘', label); fails += 1; };
const warn = (label) => { console.log('  ⚠', label); warns += 1; };
const check = (cond, label) => (cond ? ok(label) : bad(label));
const has = (text, needle) => text.includes(needle);

console.log(`Verificando v1.2 «El Gazofilacio» en: ${root}\n`);

// ── 1. Esquema y migración aditiva ──
console.log('1. Esquema y migración aditiva');
const schema = read('prisma', 'schema.prisma');
check(has(schema, 'model Purchase'), 'schema.prisma declara el modelo Purchase');
check(has(schema, 'equippedMarco') && has(schema, 'equippedTitulo'), 'Player lleva equippedMarco y equippedTitulo');
check(has(schema, 'bendiciones String[] @default([])'), 'Game lleva bendiciones con valor por defecto');
check(has(schema, 'purchases      Purchase[]') || has(schema, 'purchases Purchase[]'), 'Player relaciona sus compras');
const migration = read('prisma', 'migrations', '202611130001_gazofilacio', 'migration.sql');
check(migration.length > 0, 'existe prisma/migrations/202611130001_gazofilacio/migration.sql');
check(has(migration, 'CREATE TABLE "Purchase"'), 'la migración crea la tabla Purchase');
check(has(migration, 'ADD COLUMN "equippedMarco"') && has(migration, 'ADD COLUMN "equippedTitulo"'), 'la migración añade las columnas de cosméticos');
check(has(migration, 'ADD COLUMN "bendiciones"'), 'la migración añade bendiciones a Game');
check(has(migration, 'Purchase_playerId_fkey'), 'la migración añade la llave foránea de Purchase');

// ── 2. Catálogo del Gazofilacio ──
console.log('\n2. Catálogo y precios (src/lib/store.ts)');
const store = read('src', 'lib', 'store.ts');
check(has(store, 'LAMPARA_PRICE = 10'), 'Lámpara: 10 Siclos');
check(has(store, 'SOL_PRICE = 15') && has(store, 'SOL_SECONDS = 15') && has(store, 'SOL_MAX_USES = 3'), 'Sol de Josué: 15 Siclos, 15 segundos, hasta 3 usos');
check(has(store, 'price: 45') && has(store, 'price: 90') && has(store, 'price: 150'), 'Redención por tramos 45 / 90 / 150');
check(has(store, 'marco:cedro') && has(store, 'marco:onix') && has(store, 'marco:zafiro'), 'marcos Cedro, Ónix y Zafiro');
check(has(store, 'titulo:bereano') && has(store, 'titulo:escriba') && has(store, 'titulo:salomon'), 'títulos Bereano, Escriba fiel y Sabiduría de Salomón');
check(has(store, 'redencionPrice'), 'redencionPrice define el precio por escalón de la caída');

// ── 3. Servidor: cobros atómicos y Redención ──
console.log('\n3. Servidor de juego (src/lib/server/game.ts)');
const game = read('src', 'lib', 'server', 'game.ts');
check(has(game, "action === 'lampara' || action === 'sol'"), 'act() atiende lampara y sol');
check(has(game, "action === 'redencion'"), 'act() atiende redencion (única acción sobre partida terminada)');
check(has(game, 'siclos: { gte: price }') || has(game, 'siclos:{gte:price}'), 'cobro atómico: solo descuenta si el saldo alcanza');
check(has(game, 'tx.purchase.create'), 'cada gasto queda registrado en Purchase');
check(has(game, "id: { notIn: usedIds }"), 'la Redención sortea pregunta fresca excluyendo las recorridas');
check(has(game, "status: 'lost'"), 'la reapertura valida contra partidas perdidas con guard de versión');
check(has(game, 'total - game.siclos'), 'tras Redención el cierre acredita solo la diferencia pendiente');
check(has(game, 'round.revealed') && has(game, 'round.revealed ? { reference: round.reference }'), 'la referencia solo sale del servidor cuando la Lámpara la pagó');
check(has(game, "game.status === 'lost' && game.level >= 2 && !game.bendiciones.includes('redencion')"), 'canRedeem lo decide el servidor');
check(has(game, 'En modo paz el reloj no corre'), 'el Sol se rechaza en modo paz');

// ── 4. Rutas API ──
console.log('\n4. Rutas API');
const actRoute = read('src', 'app', 'api', 'games', '[id]', 'route.ts');
check(has(actRoute, "'lampara', 'sol', 'redencion'"), 'la acción de partida acepta las bendiciones nuevas');
const storeRoute = read('src', 'app', 'api', 'store', 'route.ts');
check(storeRoute.length > 0, 'existe GET/POST /api/store');
check(has(storeRoute, "'comprar', 'equipar', 'quitar'"), 'la tienda compra, equipa y quita');
check(has(storeRoute, 'isCosmetic'), 'la tienda rechaza las bendiciones: se ofrendan en partida');
const playerRoute = read('src', 'app', 'api', 'player', 'route.ts');
check(has(playerRoute, 'equippedMarco') && has(playerRoute, 'equippedTitulo'), '/api/player entrega los cosméticos equipados');
const board = read('src', 'app', 'api', 'leaderboard', 'route.ts');
check(has(board, 'p."equippedMarco"') && has(board, 'p."equippedTitulo"'), 'el Salón entrega los cosméticos equipados');

// ── 5. Pantallas ──
console.log('\n5. Pantallas y experiencia');
const shop = read('src', 'components', 'game', 'ShopScreen.tsx');
check(shop.length > 0, 'existe ShopScreen (la tienda del menú)');
check(has(shop, '¿Ofrendar') && has(shop, 'armed'), 'la compra exige confirmación explícita');
check(has(shop, 'Bendiciones de partida'), 'la tienda presenta las bendiciones sin venderlas');
const menu = read('src', 'components', 'game', 'MainMenu.tsx');
check(has(menu, 'El Gazofilacio'), 'el menú incorpora el botón El Gazofilacio');
check(has(menu, 'AvatarFrame'), 'el menú muestra el marco equipado');
const gameScreen = read('src', 'components', 'game', 'GameScreen.tsx');
check(has(gameScreen, 'Bendiciones del Gazofilacio'), 'GameScreen tiene la fila plateada de bendiciones');
check(has(gameScreen, 'initialGame'), 'GameScreen admite reanudar la partida reabierta por la Redención');
check(has(gameScreen, 'game.question?.reference'), 'la referencia pagada se muestra junto a las opciones');
const results = read('src', 'components', 'game', 'ResultsScreen.tsx');
check(has(results, 'Redención de Jonás'), 'la pantalla de derrota ofrece la Redención');
check(has(results, 'Te faltan'), 'el botón de Redención muestra el faltante cuando el saldo no alcanza');
check(has(results, 'onRedeemed'), 'tras confirmar, la partida reabierta vuelve al juego');
const hall = read('src', 'components', 'game', 'HallOfFaith.tsx');
check(has(hall, 'equippedTitulo') && has(hall, 'equippedMarco'), 'el Salón muestra marco y título');
const howto = read('src', 'components', 'game', 'HowToPlay.tsx');
check(has(howto, 'El Gazofilacio'), 'la guía estrena la sección del Gazofilacio');
check(existsSync(join(root, 'src', 'components', 'game', 'AvatarFrame.tsx')), 'existe AvatarFrame (marcos de perfil)');

// ── 6. Pruebas ──
console.log('\n6. Pruebas');
const rules = read('tests', 'rules.test.mjs');
check(has(rules, 'tramos de la Redención de Jonás'), 'rules cubre catálogo y tramos');
const integration = read('tests', 'integration.mjs');
check(has(integration, 'el Gazofilacio — tienda, bendiciones y Redención de Jonás'), 'integration cubre tienda, bendiciones y Redención');
check(has(integration, 'db.purchase.deleteMany'), 'la limpieza de pruebas borra las compras (llave foránea)');
const readme = read('README-LOCAL.md');
check(has(readme, 'El Gazofilacio'), 'README-LOCAL documenta la v1.2');
check(!has(readme, 'Salón de la Fe'), 'README-LOCAL sin vocabulario viejo «Salón de la Fe»');

// ── Resumen ──
console.log(`\nResultado: ${fails === 0 ? 'V1.2 COMPLETA' : `${fails} comprobación(es) crítica(s) fallan`}${warns ? ` · ${warns} aviso(s)` : ''}`);
if (fails > 0) {
  console.log('No despliegues: falta parte del parche v1.2. Reaplica v1.2-gazofilacio.patch (git apply) y vuelve a verificar.');
  process.exit(1);
}
console.log('Siguiente paso del runbook: typecheck, pruebas, migración de Neon (VPN apagado) y push.');
process.exit(0);
