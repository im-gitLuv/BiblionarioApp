import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { validateBank } from '../scripts/question-bank.mjs';
import { safeHavenAmount, walkAwayAmount, prizeForLevel, LADDER } from '../src/lib/rules.ts';
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
