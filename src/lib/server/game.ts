import 'server-only';
import { randomInt } from 'node:crypto';
import type { Game, Prisma } from '@prisma/client';
import type { ActionReply, Outcome, PublicGame } from '../contracts';
import { prizeForLevel, safeHavenAmount, walkAwayAmount } from '../rules';
import { db } from '../db';
export type Round = {
    id: string;
    category: string;
    prompt: string;
    options: string[];
    answer: number;
    reference: string;
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
export function publicGame(game: Game): PublicGame {
    const round = (game.rounds as Round[])[game.level - 1];
    return {
        id: game.id, level: game.level, amount: game.amount, version: game.version,
        deadline: game.deadline.toISOString(), lifelines: game.lifelines, removed: game.removed,
        question: game.status === 'playing' ? { category: round.category, question: round.prompt, options: round.options } : null,
        result: game.status === 'playing' ? null : { outcome: game.status as Outcome, amount: game.amount, level: game.level, lifelinesUsed: game.lifelines.length },
    };
}
export async function startGame(playerId: string) {
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
        return { id: q.id, category: q.category, prompt: q.prompt, reference: q.reference, options: order.map(i => q.options[i]), answer: order.indexOf(q.answer) };
    });
    // Serialize starts for one player, including simultaneous tabs.
    return db.$transaction(async (tx) => {
        await tx.$queryRaw `SELECT id FROM "Player" WHERE id = ${playerId} FOR UPDATE`;
        const recent = await tx.game.count({ where: { playerId, createdAt: { gte: new Date(Date.now() - 60000) } } });
        if (recent >= 5)
            throw new GameError('Espera un minuto antes de iniciar otra partida.', 429);
        const active = await tx.game.findFirst({ where: { playerId, status: 'playing' }, orderBy: { createdAt: 'desc' } });
        if (active)
            return publicGame(active);
        const game = await tx.game.create({ data: { playerId, rounds, deadline: new Date(Date.now() + 45000) } });
        return publicGame(game);
    });
}
export async function act(playerId: string, id: string, version: number, action: string, option?: number): Promise<ActionReply> {
    return db.$transaction(async (tx) => {
        const game = await tx.game.findFirst({ where: { id, playerId } });
        if (!game)
            throw new GameError('Partida no encontrada.', 404);
        if (game.status !== 'playing')
            return { game: publicGame(game) };
        if (game.version !== version)
            throw new GameError('La partida cambió. Recupera su estado para continuar.', 409);
        const round = (game.rounds as Round[])[game.level - 1];
        const expired = Date.now() >= game.deadline.getTime();
        const data: Prisma.GameUpdateManyMutationInput = { version: { increment: 1 } };
        const reply: Omit<ActionReply, 'game'> = {};
        if (expired || action === 'answer' || action === 'timeout') {
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
                data.level = game.level + 1;
                data.amount = prizeForLevel(game.level);
                data.removed = [];
                // Includes a three-second window for displaying the previous answer.
                data.deadline = new Date(Date.now() + 48000);
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
            data.deadline = new Date(game.deadline.getTime() + (action === 'fifty' ? 0 : 10000));
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
        const changed = await tx.game.updateMany({ where: { id, playerId, version, status: 'playing' }, data });
        if (changed.count !== 1)
            throw new GameError('Otra acción ya actualizó esta partida.', 409);
        return { ...reply, game: publicGame((await tx.game.findUniqueOrThrow({ where: { id } }))) };
    });
}
