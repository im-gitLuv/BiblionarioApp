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
        return { name: p.name, tag: p.tag, totalCrowns: totals._sum.amount ?? 0, knowledgeCrowns, gamesPlayed: totals._count, siclos: p.siclos, streak: p.streak, bestStreak: p.bestStreak, equippedMarco: p.equippedMarco, equippedTitulo: p.equippedTitulo };
    });
}
export async function POST(request: Request) {
    return handle(async () => {
        sameOrigin(request);
        // newProfile: crea un perfil aparte en lugar de renombrar el actual,
        // para que dos personas (o dos nombres iguales) en el mismo navegador
        // lleven sus Coronas por separado.
        const { name, newProfile } = z.object({ name: z.string().trim().min(2).max(30).regex(/^[\p{L}\p{N} ._-]+$/u), newProfile: z.boolean().optional() }).strict().parse(await request.json());
        let p;
        try {
            p = await player();
        }
        catch (error) {
            if (!(error instanceof Error && 'status' in error && error.status === 401))
                throw error;
        }
        const saved = p && !newProfile ? await db.player.update({ where: { id: p.id }, data: { name } }) : await createPlayer(name);
        return { name: saved.name, tag: saved.tag };
    });
}
