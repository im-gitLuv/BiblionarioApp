import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { PrismaClient } from '@prisma/client';
import { validateBank } from './question-bank.mjs';
const file = process.argv[2];
if (!file) throw new Error('Uso: npm run db:import -- ruta/al/banco.json');
const questions = validateBank(JSON.parse(await readFile(resolve(file), 'utf8')));
const db = new PrismaClient();
try {
  await db.$transaction(questions.map(q => db.question.upsert({ where: { id: q.id }, create: q, update: q })));
  console.log(`${questions.length} preguntas importadas. Las preguntas ajenas al archivo no se eliminan.`);
  const levels = await db.question.groupBy({ by: ['level'], where: { active: true }, _count: true });
  for (let level = 1; level <= 15; level++) console.log(`Escalón ${level}: ${levels.find(row => row.level === level)?._count || 0}`);
} finally { await db.$disconnect(); }
