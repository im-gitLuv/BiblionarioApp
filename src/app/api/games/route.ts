import { startGame } from '@/lib/server/game';
import { handle, player, sameOrigin } from '@/lib/server/http';
import { z } from 'zod';
export const runtime = 'nodejs';
export async function POST(request: Request) { return handle(async () => { sameOrigin(request); const { timeLimit } = z.object({ timeLimit: z.union([z.literal(0), z.literal(30), z.literal(45), z.literal(60)]).default(45) }).strict().parse(await request.json()); return startGame((await player()).id, timeLimit); }); }
