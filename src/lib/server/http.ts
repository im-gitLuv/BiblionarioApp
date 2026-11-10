import 'server-only';
import { cookies } from 'next/headers';
import { createHash, randomBytes } from 'node:crypto';
import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { db } from '../db';
import { GameError } from './game';
const COOKIE = 'biblionario-player';
export const hash = (value: string) => createHash('sha256').update(value).digest('hex');
// Etiqueta pública de 4 caracteres hexadecimales en mayúsculas: distingue
// perfiles con el mismo nombre ("Luis · 3F7A" frente a "Luis · 9B1C") sin
// exponer nada privado. El alfabeto hexadecimal evita letras ambiguas.
const randomTag = () => randomBytes(2).toString('hex').toUpperCase();
export async function player() {
    const token = (await cookies()).get(COOKIE)?.value;
    const found = token && await db.player.findUnique({ where: { tokenHash: hash(token) } });
    if (!found)
        throw new GameError('Escribe tu nombre para comenzar.', 401);
    return found;
}
export async function createPlayer(name: string) {
    const token = randomBytes(32).toString('hex');
    // La etiqueta es única: ante la colisión (casi imposible con 65.536
    // combinaciones) se reintenta con otra antes de fallar.
    for (let attempt = 0;; attempt++) {
        try {
            const saved = await db.player.create({ data: { name, tokenHash: hash(token), tag: randomTag() } });
            (await cookies()).set(COOKIE, token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 365 });
            return saved;
        }
        catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002' && attempt < 8)
                continue;
            throw error;
        }
    }
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
        if (error instanceof Prisma.PrismaClientInitializationError)
            return NextResponse.json({ error: process.env.NODE_ENV === 'production'
                ? 'El servicio no está disponible. Inténtalo de nuevo en unos momentos.'
                : 'No hay conexión con la base de datos. En local: docker compose up -d y revisa DATABASE_URL y DIRECT_URL en .env (pasos en README-LOCAL.md).' }, { status: 503 });
        console.error('Biblionario API', error instanceof Error ? error.name : 'UnknownError');
        return NextResponse.json({ error: 'El servicio no está disponible. Inténtalo de nuevo en unos momentos.' }, { status: 503 });
    }
}
