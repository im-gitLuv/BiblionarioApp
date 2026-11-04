import { z } from 'zod';
export const questionSchema = z.object({
  id: z.string().regex(/^es-[a-z0-9-]+$/), level: z.number().int().min(1).max(15),
  category: z.string().trim().min(2).max(80), prompt: z.string().trim().min(10).max(600),
  options: z.array(z.string().trim().min(1).max(200)).length(4).refine(a => new Set(a.map(s => s.toLocaleLowerCase('es'))).size === 4, 'Las opciones deben ser distintas'),
  answer: z.number().int().min(0).max(3), reference: z.string().trim().min(3).max(120), active: z.boolean(),
}).strict();
export function validateBank(input) {
  const questions = z.array(questionSchema).min(1).max(10000).parse(input);
  if (new Set(questions.map(q => q.id)).size !== questions.length) throw new Error('IDs repetidos');
  if (new Set(questions.map(q => q.prompt.toLocaleLowerCase('es'))).size !== questions.length) throw new Error('Preguntas repetidas');
  return questions;
}
