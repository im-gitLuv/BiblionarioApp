import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { validateBank } from '../scripts/question-bank.mjs';
import { safeHavenAmount, walkAwayAmount, prizeForLevel, LADDER } from '../src/lib/rules.ts';
import { siclosForLevels, streakBonus, nextStreak, awardSiclos } from '../src/lib/economy.ts';
test('premios en los límites de refugios y retiro', () => {
  assert.equal(safeHavenAmount(5), 0); assert.equal(safeHavenAmount(6), 1000);
  assert.equal(safeHavenAmount(10), 1000); assert.equal(safeHavenAmount(11), 32000);
  assert.equal(walkAwayAmount(1), 0); assert.equal(walkAwayAmount(6), 1000);
  assert.equal(walkAwayAmount(15), 500000); assert.equal(prizeForLevel(15), 1000000);
  assert.deepEqual(LADDER.filter(s => s.safe).map(s => s.level), [5, 10]);
});
const bank = JSON.parse(await readFile(new URL('../prisma/questions.es.json', import.meta.url), 'utf8'));
test('banco semilla válido con variedad en los quince escalones', () => {
  const rows = validateBank(bank);
  for (let i = 1; i <= 15; i++) assert.ok(rows.filter(q => q.active && q.level === i).length >= 30, `Escalón ${i}: requiere al menos 30 preguntas activas`);
});
test('rechaza respuestas fuera de rango, duplicados y escalones inexistentes', () => {
  assert.throws(() => validateBank([{ ...bank[0], answer: 4 }]));
  assert.throws(() => validateBank([{ ...bank[0], level: 16 }]));
  assert.throws(() => validateBank([bank[0], bank[0]]));
  assert.throws(() => validateBank([{ ...bank[0], options: ['A', 'a', 'B', 'C'] }]));
});

test('emisión de Siclos por escalones completados: 5, 10 y 20 por tramo', () => {
  assert.equal(siclosForLevels(0), 0);
  assert.equal(siclosForLevels(5), 25);
  assert.equal(siclosForLevels(10), 75);
  assert.equal(siclosForLevels(15), 175);
  assert.equal(siclosForLevels(7), 45); // falló en el 7: cinco chicos y dos medianos
  assert.equal(siclosForLevels(-3), 0);
});

test('modo paz cobra la mitad (piso) y el bono de racha tiene tope de +50%', () => {
  assert.equal(awardSiclos(15, true, 0).total, 87);
  assert.equal(awardSiclos(15, false, 0).total, 175);
  assert.equal(awardSiclos(15, false, 1).bonus, 8);   // 5% de 175 = 8,75 → 8
  assert.equal(awardSiclos(15, false, 1).total, 183);
  assert.equal(awardSiclos(15, false, 10).bonus, 87); // tope: +50% de 175
  assert.equal(awardSiclos(15, false, 25).bonus, 87); // la racha no supera el tope
  assert.equal(awardSiclos(0, false, 3).total, 0);    // sin escalones no hay emisión
});

test('racha diaria por jornada de Caracas: conserva, suma al día siguiente y reinicia tras salto', () => {
  const now = new Date('2026-11-11T15:00:00Z'); // 11:00 de Caracas, día 2026-11-11
  assert.equal(nextStreak(4, null, now), 1);
  assert.equal(nextStreak(4, new Date('2026-11-11T14:00:00Z'), now), 4); // ya jugó hoy
  assert.equal(nextStreak(4, new Date('2026-11-10T15:00:00Z'), now), 5); // ayer → +1
  assert.equal(nextStreak(4, new Date('2026-11-09T15:00:00Z'), now), 1); // saltó un día
  assert.equal(nextStreak(0, new Date('2026-11-10T15:00:00Z'), now), 1);
  // Cruce de medianoche: 23:00 del día anterior → 00:30 de hoy suma la racha.
  const trasMedianoche = new Date('2026-11-11T04:30:00Z'); // 00:30 de Caracas
  const nocheAnterior = new Date('2026-11-11T03:00:00Z');  // 23:00 de Caracas del día 10
  assert.equal(nextStreak(2, nocheAnterior, trasMedianoche), 3);
});
