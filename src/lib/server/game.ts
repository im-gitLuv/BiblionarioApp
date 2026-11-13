import 'server-only';
import { randomInt } from 'node:crypto';
import type { Game, Prisma } from '@prisma/client';
import type { ActionReply, Outcome, PublicGame } from '../contracts';
import { prizeForLevel, safeHavenAmount, walkAwayAmount } from '../rules';
import { awardSiclos, nextStreak } from '../economy';
import { LAMPARA_PRICE, SOL_MAX_USES, SOL_PRICE, SOL_SECONDS, redencionPrice } from '../store';
import { db } from '../db';
export type Round = {
    id: string;
    category: string;
    prompt: string;
    options: string[];
    answer: number;
    reference: string;
    awaitingNext?: boolean;
    timeLimit?: 0 | 30 | 45 | 60;
    // Lámpara: la referencia de este nivel ya se ofrendó y se reveló.
    revealed?: boolean;
};
export class GameError extends Error {
    constructor(message: string, public status = 400) { super(message); }
}
export function shuffled<T>(items: T[]): T[] {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i--) {
        const j = randomInt(i + 1);
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
}
export function publicGame(game: Game, wallet: number): PublicGame {
    const round = (game.rounds as Round[])[game.level - 1];
    return {
        id: game.id, level: game.level, amount: game.amount, version: game.version, siclos: game.siclos,
        wallet,
        bendiciones: game.bendiciones,
        review: round.awaitingNext ? { answer: round.answer, reference: round.reference, correct: true } : undefined,
        deadline: round.awaitingNext || (round.timeLimit ?? 45) === 0 ? null : game.deadline.toISOString(), timeLimit: round.timeLimit ?? 45, lifelines: game.lifelines, removed: game.removed,
        // La referencia solo sale del servidor cuando la Lámpara la pagó:
        // la instantánea privada nunca viaja gratis al cliente.
        question: game.status === 'playing' ? { category: round.category, question: round.prompt, options: round.options, ...(round.revealed ? { reference: round.reference } : {}) } : null,
        result: game.status === 'playing' ? null : {
            outcome: game.status as Outcome, amount: game.amount, level: game.level, lifelinesUsed: game.lifelines.length, siclos: game.siclos,
            gameId: game.id, version: game.version,
            // Solo el servidor decide si la Redención está disponible:
            // derrota en un escalón posterior al primero y sin Redención previa.
            canRedeem: game.status === 'lost' && game.level >= 2 && !game.bendiciones.includes('redencion'),
        },
    };
}
export async function startGame(playerId: string, timeLimit: 0 | 30 | 45 | 60 = 45) {
    // Fetch IDs only; bank growth does not send all question bodies to the runtime.
    const candidates = await db.question.findMany({ where: { active: true }, select: { id: true, level: true } });
    const ids = Array.from({ length: 15 }, (_, i) => {
        const pool = candidates.filter(q => q.level === i + 1);
        if (!pool.length)
            throw new GameError('El banco aún no tiene preguntas en todos los escalones.', 503);
        return pool[randomInt(pool.length)].id;
    });
    const questions = await db.question.findMany({ where: { id: { in: ids } } });
    const rounds = ids.map(id => {
        const q = questions.find(q => q.id === id)!;
        const order = shuffled([0, 1, 2, 3]);
        return { id: q.id, category: q.category, prompt: q.prompt, reference: q.reference, options: order.map(i => q.options[i]), answer: order.indexOf(q.answer), timeLimit };
    });
    // Serialize starts for one player, including simultaneous tabs.
    return db.$transaction(async (tx) => {
        await tx.$queryRaw `SELECT id FROM "Player" WHERE id = ${playerId} FOR UPDATE`;
        const me = await tx.player.findUniqueOrThrow({ where: { id: playerId }, select: { siclos: true } });
        const recent = await tx.game.count({ where: { playerId, createdAt: { gte: new Date(Date.now() - 60000) } } });
        if (recent >= 5)
            throw new GameError('Espera un minuto antes de iniciar otra partida.', 429);
        const active = await tx.game.findFirst({ where: { playerId, status: 'playing' }, orderBy: { createdAt: 'desc' } });
        if (active)
            return publicGame(active, me.siclos);
        const game = await tx.game.create({ data: { playerId, rounds, deadline: new Date(Date.now() + (timeLimit || 45) * 1000) } });
        return publicGame(game, me.siclos);
    });
}
/** Ofrenda atómica del Gazofilacio: descuenta Siclos solo si el saldo
 *  alcanza y registra la compra en el historial. El cobro y el efecto
 *  comparten la transacción de la acción; el cliente nunca decide si hubo
 *  cobro. wallet llega sincronizado dentro de la misma transacción. */
async function charge(tx: Prisma.TransactionClient, playerId: string, wallet: { siclos: number }, item: string, price: number, gameId?: string) {
    const updated = await tx.player.updateMany({ where: { id: playerId, siclos: { gte: price } }, data: { siclos: { decrement: price } } });
    if (updated.count !== 1)
        throw new GameError(`Te faltan ${Math.max(0, price - wallet.siclos)} Siclos para ofrendar por este artículo.`, 400);
    wallet.siclos -= price;
    await tx.purchase.create({ data: { playerId, item, price, ...(gameId ? { gameId } : {}) } });
}
/** Redención de Jonás: la única acción que reabre una partida terminada.
 *  Cobra el tramo del escalón de la caída, sortea una pregunta fresca del
 *  mismo nivel excluyendo las ya recorridas y restaura el estado de juego en
 *  curso conservando el refugio. No toca racha ni emisión: la partida ya
 *  contó como jugada del día cuando se perdió, y cuenta una sola vez. */
async function redeem(tx: Prisma.TransactionClient, game: Game, walletSiclos: number): Promise<ActionReply> {
    if (game.status !== 'lost')
        throw new GameError('Solo una partida perdida admite Redención.');
    const price = redencionPrice(game.level);
    if (price === null)
        throw new GameError('La caída en el primer escalón no admite Redención: reinicia el camino, es gratuito.');
    if (game.bendiciones.includes('redencion'))
        throw new GameError('Este recorrido ya usó su Redención de Jonás: la derrota es definitiva.');
    const rounds = game.rounds as Round[];
    const usedIds = rounds.map(round => round.id);
    const candidates = await tx.question.findMany({ where: { active: true, level: game.level, id: { notIn: usedIds } }, select: { id: true } });
    if (!candidates.length)
        throw new GameError('El banco no tiene una pregunta fresca para este escalón: la Redención no se ofrendó.', 400);
    const picked = await tx.question.findUniqueOrThrow({ where: { id: candidates[randomInt(candidates.length)].id } });
    const order = shuffled([0, 1, 2, 3]);
    const previous = rounds[game.level - 1];
    const timeLimit = previous.timeLimit ?? 45;
    const fresh: Round = { id: picked.id, category: picked.category, prompt: picked.prompt, reference: picked.reference, options: order.map(i => picked.options[i]), answer: order.indexOf(picked.answer), timeLimit };
    const wallet = { siclos: walletSiclos };
    await charge(tx, game.playerId, wallet, 'redencion', price, game.id);
    const changed = await tx.game.updateMany({
        where: { id: game.id, playerId: game.playerId, version: game.version, status: 'lost' },
        data: {
            version: { increment: 1 },
            status: 'playing',
            rounds: rounds.map((item, index) => index === game.level - 1 ? fresh : item),
            bendiciones: [...game.bendiciones, 'redencion'],
            removed: [],
            // El reloj se renueva; el monto del refugio vigente se conserva.
            deadline: new Date(Date.now() + (timeLimit || 45) * 1000),
        },
    });
    if (changed.count !== 1)
        throw new GameError('Otra acción ya actualizó esta partida.', 409);
    const reopened = await tx.game.findUniqueOrThrow({ where: { id: game.id } });
    return { game: publicGame(reopened, wallet.siclos) };
}
export async function act(playerId: string, id: string, version: number, action: string, option?: number): Promise<ActionReply> {
    return db.$transaction(async (tx) => {
        const game = await tx.game.findFirst({ where: { id, playerId } });
        if (!game)
            throw new GameError('Partida no encontrada.', 404);
        const me = await tx.player.findUniqueOrThrow({ where: { id: playerId }, select: { siclos: true } });
        if (game.status !== 'playing') {
            // La Redención es la única acción que admite una partida terminada.
            if (action === 'redencion') {
                if (game.version !== version)
                    throw new GameError('La partida cambió. Recupera su estado para continuar.', 409);
                return redeem(tx, game, me.siclos);
            }
            return { game: publicGame(game, me.siclos) };
        }
        if (game.version !== version)
            throw new GameError('La partida cambió. Recupera su estado para continuar.', 409);
        const round = (game.rounds as Round[])[game.level - 1];
        const timeLimit = round.timeLimit ?? 45;
        const expired = timeLimit !== 0 && Date.now() >= game.deadline.getTime();
        const data: Prisma.GameUpdateManyMutationInput = { version: { increment: 1 } };
        const reply: Omit<ActionReply, 'game'> = {};
        if (round.awaitingNext) {
            if (action !== 'next') throw new GameError('Lee el resultado y pulsa Siguiente pregunta.');
            data.level = game.level + 1;
            data.removed = [];
            data.deadline = new Date(Date.now() + (timeLimit || 45) * 1000);
        }
        else if (action === 'next') {
            throw new GameError('Primero responde la pregunta.');
        }
        else if (action === 'lampara' || action === 'sol') {
            // Bendiciones del Gazofilacio: cobran al usarse, dentro de esta
            // misma transacción y con el guard de versión. El reloj agotado
            // cierra el nivel, así que no admiten ofrenda tardía.
            if (expired)
                throw new GameError('El reloj de este nivel ya se agotó.');
            if (action === 'lampara') {
                if (game.bendiciones.includes('lampara'))
                    throw new GameError('La Lámpara ya alumbró este recorrido.');
                await charge(tx, playerId, me, 'lampara', LAMPARA_PRICE, game.id);
                data.bendiciones = [...game.bendiciones, 'lampara'];
                // La revelación persiste en el estado del nivel: sobrevive a
                // recargas y cambios de pantalla hasta responder.
                data.rounds = (game.rounds as Round[]).map((item, index) =>
                    index === game.level - 1 ? { ...item, revealed: true } : item);
            }
            else {
                const uses = game.bendiciones.filter(item => item === 'sol').length;
                if (uses >= SOL_MAX_USES)
                    throw new GameError(`El Sol de Josué ya detuvo su curso ${SOL_MAX_USES} veces en este recorrido.`);
                if (timeLimit === 0)
                    throw new GameError('En modo paz el reloj no corre: no hay tiempo que detener.');
                await charge(tx, playerId, me, 'sol', SOL_PRICE, game.id);
                data.bendiciones = [...game.bendiciones, 'sol'];
                // Misma ampliación de plazo de lectura que los comodines de consejo.
                data.deadline = new Date(game.deadline.getTime() + SOL_SECONDS * 1000);
            }
        }
        else if (expired || action === 'answer' || action === 'timeout') {
            if (action === 'timeout' && !expired)
                throw new GameError('Todavía queda tiempo.');
            if (!expired && (option === undefined || game.removed.includes(option)))
                throw new GameError('Elige una respuesta disponible.');
            const correct = !expired && option === round.answer;
            reply.reveal = { answer: round.answer, reference: round.reference, correct };
            if (!correct || game.level === 15) {
                data.status = correct ? 'won' : 'lost';
                data.amount = correct ? 1000000 : safeHavenAmount(game.level);
                data.finishedAt = new Date();
            }
            else {
                data.amount = prizeForLevel(game.level);
                // Persist the reading pause without starting or exposing the next question.
                data.rounds = (game.rounds as Round[]).map((item, index) =>
                    index === game.level - 1 ? { ...item, awaitingNext: true } : item);
            }
        }
        else if (action === 'walk') {
            data.status = 'walked';
            data.amount = walkAwayAmount(game.level);
            data.finishedAt = new Date();
        }
        else if (['fifty', 'audience', 'prophet'].includes(action)) {
            if (game.lifelines.includes(action))
                throw new GameError('Ya utilizaste este comodín.');
            data.lifelines = [...game.lifelines, action];
            // Bounded reading allowance; closing/opening the dialog cannot extend time.
            if (timeLimit !== 0) data.deadline = new Date(game.deadline.getTime() + (action === 'fifty' ? 0 : 10000));
            const wrong = [0, 1, 2, 3].filter(i => i !== round.answer && !game.removed.includes(i));
            if (action === 'fifty')
                data.removed = shuffled(wrong).slice(0, 2);
            if (action === 'prophet')
                reply.hint = { suggestion: randomInt(100) < (game.level <= 5 ? 92 : game.level <= 10 ? 85 : 78) ? round.answer : shuffled(wrong)[0] };
            if (action === 'audience') {
                const votes = [0, 0, 0, 0];
                votes[round.answer] = Math.max(42, 92 - game.level * 3);
                let left = 100 - votes[round.answer];
                shuffled(wrong).forEach((index, i) => { const n = i === wrong.length - 1 ? left : randomInt(left + 1); votes[index] = n; left -= n; });
                reply.hint = { votes };
            }
        }
        else
            throw new GameError('Acción no válida.');
        // Emisión de Siclos y racha: solo al finalizar la partida, dentro de la
        // misma transacción y con el guard de versión; repetir la lectura de
        // una partida terminada nunca vuelve a pagar. Tras una Redención, la
        // caída anterior ya emitió por los escalones vencidos: el cierre paga
        // la diferencia pendiente (sin recargo ni castigo) y Game.siclos
        // conserva la emisión total del recorrido como libro contable.
        let awarded: { total: number; streak: number; bestStreak: number } | null = null;
        if (data.status) {
            const completed = data.status === 'won' ? 15 : game.level - 1;
            const profile = await tx.player.findUniqueOrThrow({
                where: { id: playerId },
                select: { streak: true, bestStreak: true, lastPlayedAt: true },
            });
            const streak = nextStreak(profile.streak, profile.lastPlayedAt, new Date());
            const { total } = awardSiclos(completed, timeLimit === 0, streak);
            const pending = Math.max(0, total - game.siclos);
            awarded = { total: pending, streak, bestStreak: Math.max(profile.bestStreak, streak) };
            // Libro contable del recorrido: lo ya emitido más lo acreditado
            // ahora; si el bono de racha bajó entre cierres, nunca retrocede.
            data.siclos = game.siclos + pending;
        }
        const changed = await tx.game.updateMany({ where: { id, playerId, version, status: 'playing' }, data });
        if (changed.count !== 1)
            throw new GameError('Otra acción ya actualizó esta partida.', 409);
        if (awarded)
            await tx.player.update({
                where: { id: playerId },
                data: {
                    siclos: { increment: awarded.total },
                    streak: awarded.streak,
                    bestStreak: awarded.bestStreak,
                    lastPlayedAt: new Date(),
                },
            });
        return { ...reply, game: publicGame((await tx.game.findUniqueOrThrow({ where: { id } })), me.siclos) };
    });
}
