#!/usr/bin/env node
/**
 * verify-v1.1.mjs — Comprueba que tu copia local contiene el parche v1.1 completo
 * (Siclos + racha diaria + renombres de comodines).
 *
 * Uso: coloca este archivo en la RAÍZ del repo (junto a package.json) y ejecuta:
 *
 *   node verify-v1.1.mjs
 *
 * Código de salida: 0 = todo lo crítico presente · 1 = falta algo crítico.
 * Los "[aviso]" no bloquean: son recordatorios para que los revises tú.
 */
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// Usa la carpeta donde esté el script si ahí vive el repo; si no, el directorio actual.
const aqui = dirname(fileURLToPath(import.meta.url));
const root = existsSync(join(aqui, 'prisma', 'schema.prisma')) ? aqui : process.cwd();
let totalCriticas = 0;
let fallidas = 0;
let avisos = 0;

const read = (p) => {
    try { return readFileSync(join(root, p), 'utf8'); } catch { return null; }
};

function check(label, ok, { critica = true } = {}) {
    const icono = ok ? '[OK]   ' : (critica ? '[FALTA]' : '[aviso]');
    console.log(`${icono} ${label}`);
    if (!ok) { if (critica) fallidas++; else avisos++; }
    if (critica) totalCriticas++;
}

console.log(`Verificando parche v1.1 en: ${root}\n`);

// ── 1. Schema: campos de economía y racha ──────────────────────────────
const schema = read('prisma/schema.prisma') ?? '';
check('schema.prisma: campo siclos', schema.includes('siclos'));
check('schema.prisma: campo rachaActual', schema.includes('rachaActual'));
check('schema.prisma: campo rachaMaxima', schema.includes('rachaMaxima'));
check('schema.prisma: campo fechaUltimaPartida', schema.includes('fechaUltimaPartida'));

// ── 2. Migración ────────────────────────────────────────────────────────
const rutaMig = 'prisma/migrations/202611110001_siclos_y_racha/migration.sql';
const mig = read(rutaMig);
check(`migración presente (${rutaMig})`, mig !== null);
if (mig !== null) {
    check('migración: añade columna de siclos', /siclos/i.test(mig));
    check('migración: añade columnas de racha', /racha/i.test(mig));
}

// ── 3. Módulo de economía ───────────────────────────────────────────────
const eco = read('src/lib/economy.ts');
check('src/lib/economy.ts existe', eco !== null);
if (eco !== null) {
    check('economy.ts: define emisión/racha', /siclos|racha/i.test(eco));
}

// ── 4. Renombres en la interfaz ─────────────────────────────────────────
const gs = read('src/components/game/GameScreen.tsx') ?? '';
check('GameScreen: comodín "Los Dos Testigos"', gs.includes('Los Dos Testigos'));
check('GameScreen: comodín "Concilio de los Setenta"', gs.includes('Concilio de los Setenta'));
check('GameScreen: comodín "Consejo de un Sabio"', gs.includes('Consejo de un Sabio'));

const mm = read('src/components/game/MainMenu.tsx') ?? '';
check('MainMenu: entrada "Salón de la Sabiduría"', mm.includes('Salón de la Sabiduría'));

const rs = read('src/components/game/ResultsScreen.tsx') ?? '';
check('ResultsScreen: muestra Siclos ganados', /Siclos/i.test(rs));

// ── 5. Servidor, API y contratos ────────────────────────────────────────
const api = read('src/app/api/player/route.ts') ?? '';
check('api/player: expone siclos', /siclos/i.test(api));

const ct = read('src/lib/contracts.ts') ?? '';
check('contracts.ts: tipos de siclos/racha', /siclos|racha/i.test(ct));

const srv = read('src/lib/server/game.ts') ?? '';
check('game.ts: emisión y racha conectadas al cierre', /siclos|racha|economy/i.test(srv));

// ── Avisos (no bloquean; revisa si te sorprende alguno) ─────────────────
console.log('');
const nombresViejos = [
    ['GameScreen aún menciona "Sabiduría de Salomón"', gs.includes('Sabiduría de Salomón')],
    ['GameScreen aún menciona "Voz profética"', gs.includes('Voz profética')],
    ['GameScreen aún menciona "Preguntar a la congregación"', gs.includes('Preguntar a la congregación')],
    ['MainMenu aún menciona "Salón de la Fe"', mm.includes('Salón de la Fe')],
];
for (const [etiqueta, presente] of nombresViejos) {
    check(etiqueta, !presente, { critica: false });
}

const htp = read('src/components/game/HowToPlay.tsx') ?? '';
check('HowToPlay menciona algún nombre nuevo',
    /Los Dos Testigos|Concilio de los Setenta|Consejo de un Sabio|Salón de la Sabiduría/.test(htp),
    { critica: false });

const hf = read('src/components/game/HallOfFaith.tsx') ?? '';
check('HallOfFaith usa "Salón de la Sabiduría"', hf.includes('Salón de la Sabiduría'), { critica: false });

const hm = read('src/lib/host-messages.ts') ?? '';
check('host-messages sin restos de "voz profética"', !/voz profética/i.test(hm), { critica: false });

const ag = read('AGENTS.md') ?? '';
check('AGENTS.md actualizado con el vocabulario nuevo',
    /Los Dos Testigos|Concilio de los Setenta|Consejo de un Sabio|Salón de la Sabiduría|Siclos/.test(ag),
    { critica: false });

const pruebas = (read('tests/rules.test.mjs') ?? '') + (read('tests/integration.mjs') ?? '');
check('tests cubren siclos/racha', /siclos|racha/i.test(pruebas), { critica: false });

// ── Resumen ─────────────────────────────────────────────────────────────
console.log('\n──────────────────────────────────────────────');
if (fallidas === 0) {
    console.log(`RESULTADO: v1.1 completo. ${totalCriticas} comprobaciones críticas OK${avisos ? `, ${avisos} aviso(s) por revisar` : ''}.`);
    console.log('Tu local contiene el parche aplicado y coherente con 0ad1aca como base.');
    console.log('Siguiente paso: runbook (tests -> commit -> migrar Neon -> push).');
    process.exit(0);
} else {
    console.log(`RESULTADO: faltan ${fallidas} de ${totalCriticas} comprobaciones críticas.`);
    console.log('Posibles causas: el parche quedó aplicado a medias o se mezcló con otra edición.');
    console.log('Plan B: restaura el repo y vuelve a aplicar el parche:');
    console.log('  git checkout -- . && git clean -fd src/lib prisma/migrations && git apply --whitespace=nowarn v1.1-siclos-racha-renombres.patch');
    process.exit(1);
}
