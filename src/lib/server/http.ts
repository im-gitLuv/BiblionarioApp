import 'server-only';
import { cookies } from 'next/headers';
import { createHash, randomBytes } from 'node:crypto';
import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { db } from '../db';
import { GameError } from './game';
const COOKIE = 'biblionario-player';
export const hash = (value: string) => createHash('sha256').update(value).digest('hex');
export async function player() {
    const token = (await cookies()).get(COOKIE)?.value;
    const found = token && await db.player.findUnique({ where: { tokenHash: hash(token) } });
    if (!found)
        throw new GameError('Escribe tu nombre para comenzar.', 401);
    return found;
}
export async function createPlayer(name: string) {
    const token = randomBytes(32).toString('hex');
    const found = await db.player.create({ data: { name, tokenHash: hash(token) } });
    (await cookies()).set(COOKIE, token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 365 });
    return found;
}
export function sameOrigin(request: Request) {
    if (request.headers.get('origin') !== new URL(request.url).origin)
        throw new GameError('Origen no permitido.', 403);
}
export async function handle(work: () => Promise<unknown>) {
    try {
        return NextResponse.json(await work(), { headers: { 'Cache-Control': 'no-store' } });
    }
    catch (error) {
        if (error instanceof GameError)
            return NextResponse.json({ error: error.message }, { status: error.status });
        if (error instanceof ZodError || error instanceof SyntaxError)
            return NextResponse.json({ error: 'Datos no válidos.' }, { status: 400 });
        console.error('Biblionario API', error instanceof Error ? error.name : 'UnknownError');
        return NextResponse.json({ error: 'El servicio no está disponible. Inténtalo de nuevo en unos momentos.' }, { status: 503 });
    }
}
