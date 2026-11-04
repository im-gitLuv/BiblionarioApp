import { z } from 'zod';
import { db } from '@/lib/db';
import { createPlayer, handle, player, sameOrigin } from '@/lib/server/http';
export const runtime = 'nodejs';
export async function GET() {
    return handle(async () => {
        const p = await player();
        const [totals, knowledgeCrowns] = await Promise.all([
            db.game.aggregate({ where: { playerId: p.id, status: { in: ['won', 'walked', 'lost'] } }, _sum: { amount: true }, _count: true }),
            db.game.count({ where: { playerId: p.id, status: 'won' } }),
        ]);
        return { name: p.name, totalCrowns: totals._sum.amount ?? 0, knowledgeCrowns, gamesPlayed: totals._count };
    });
}
export async function POST(request: Request) {
    return handle(async () => {
        sameOrigin(request);
        const { name } = z.object({ name: z.string().trim().min(2).max(30).regex(/^[\p{L}\p{N} ._-]+$/u) }).strict().parse(await request.json());
        let p;
        try {
            p = await player();
        }
        catch (error) {
            if (!(error instanceof Error && 'status' in error && error.status === 401))
                throw error;
        }
        const saved = p ? await db.player.update({ where: { id: p.id }, data: { name } }) : await createPlayer(name);
        return { name: saved.name };
    });
}
