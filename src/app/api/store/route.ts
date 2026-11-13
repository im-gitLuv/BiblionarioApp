import 'server-only';
import { z } from 'zod';
import type { Prisma, Player } from '@prisma/client';
import { db } from '@/lib/db';
import { GameError } from '@/lib/server/game';
import { handle, player, sameOrigin } from '@/lib/server/http';
import { storeItem, isCosmetic } from '@/lib/store';
export const runtime = 'nodejs';

// Vista del Gazofilacio: saldo, propiedad y equipado del jugador, más el
// historial breve. El catálogo completo vive en src/lib/store.ts y viaja
// como constantes; la base de datos solo guarda lo que cambia por jugador.
async function storeView(tx: Prisma.TransactionClient, p: Player) {
    const [purchases, owned] = await Promise.all([
        tx.purchase.findMany({ where: { playerId: p.id }, orderBy: { createdAt: 'desc' }, take: 12 }),
        tx.purchase.findMany({ where: { playerId: p.id }, select: { item: true }, distinct: ['item'] }),
    ]);
    return {
        siclos: p.siclos,
        equippedMarco: p.equippedMarco,
        equippedTitulo: p.equippedTitulo,
        owned: owned.map(row => row.item),
        history: purchases.map(row => ({ item: row.item, price: row.price, gameId: row.gameId, createdAt: row.createdAt.toISOString() })),
    };
}

export async function GET() {
    return handle(async () => {
        const p = await player();
        return db.$transaction(tx => storeView(tx, p));
    });
}

export async function POST(request: Request) {
    return handle(async () => {
        sameOrigin(request);
        const me = await player();
        const body = z.object({ action: z.enum(['comprar', 'equipar', 'quitar']), item: z.string().min(1) }).strict().parse(await request.json());
        const item = storeItem(body.item);
        if (!item || !isCosmetic(item.key))
            throw new GameError('Artículo desconocido del Gazofilacio: las bendiciones se ofrendan dentro de la partida.', 400);
        return db.$transaction(async (tx) => {
            const p = await tx.player.findUniqueOrThrow({ where: { id: me.id } });
            const owned = await tx.purchase.findFirst({ where: { playerId: me.id, item: item.key } });
            if (body.action === 'comprar') {
                if (owned)
                    throw new GameError(`Ya tienes ${item.name}.`);
                const price = item.price ?? 0;
                // Cobro atómico: solo descuenta si el saldo alcanza; dos
                // pestañas simultáneas no pueden gastar el mismo Siclo.
                const updated = await tx.player.updateMany({ where: { id: me.id, siclos: { gte: price } }, data: { siclos: { decrement: price } } });
                if (updated.count !== 1)
                    throw new GameError(`Te faltan ${Math.max(0, price - p.siclos)} Siclos para ofrendar por ${item.name}.`, 400);
                await tx.purchase.create({ data: { playerId: me.id, item: item.key, price } });
                p.siclos -= price;
            }
            else if (body.action === 'equipar') {
                if (!owned)
                    throw new GameError(`Aún no tienes ${item.name}: compra primero en el Gazofilacio.`);
            }
            // «quitar» no exige propiedad: desequipar siempre es posible.
            if (body.action === 'quitar')
                await tx.player.update({ where: { id: me.id }, data: item.kind === 'marco' ? { equippedMarco: null } : { equippedTitulo: null } });
            else
                await tx.player.update({ where: { id: me.id }, data: item.kind === 'marco' ? { equippedMarco: item.key } : { equippedTitulo: item.key } });
            return storeView(tx, await tx.player.findUniqueOrThrow({ where: { id: me.id } }));
        });
    });
}
