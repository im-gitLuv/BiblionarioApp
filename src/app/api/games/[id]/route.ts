import { z } from 'zod';
import { db } from '@/lib/db';
import { act, GameError, publicGame } from '@/lib/server/game';
import { handle, player, sameOrigin } from '@/lib/server/http';
export const runtime = 'nodejs';
type Context = {
    params: Promise<{
        id: string;
    }>;
};
export async function GET(_request: Request, context: Context) {
    return handle(async () => {
        const p = await player();
        const { id } = await context.params;
        const game = await db.game.findFirst({ where: { id, playerId: p.id } });
        if (!game)
            throw new GameError('Partida no encontrada.', 404);
        return publicGame(game, p.siclos);
    });
}
export async function POST(request: Request, context: Context) {
    return handle(async () => {
        sameOrigin(request);
        const body = z.object({ version: z.number().int().nonnegative(), action: z.enum(['answer', 'next', 'timeout', 'walk', 'fifty', 'audience', 'prophet', 'lampara', 'sol', 'redencion']), option: z.number().int().min(0).max(3).optional() }).strict().parse(await request.json());
        return act((await player()).id, (await context.params).id, body.version, body.action, body.option);
    });
}
