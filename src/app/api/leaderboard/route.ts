import { db } from '@/lib/db';
import { handle } from '@/lib/server/http';
export const runtime = 'nodejs';
export async function GET() {
    return handle(async () => {
        // One best finished game per player, ranked deterministically.
        const rows = await db.$queryRaw<Array<{
            id: string;
            name: string;
            amount: number;
            level: number;
            outcome: string;
            date: Date;
        }>> `
      SELECT id, name, amount, level, status AS outcome, "finishedAt" AS date FROM (
        SELECT g.*, p.name, ROW_NUMBER() OVER (PARTITION BY "playerId" ORDER BY amount DESC, level DESC, "finishedAt" ASC, g.id ASC) AS rank
        FROM "Game" g JOIN "Player" p ON p.id = g."playerId" WHERE status IN ('won', 'walked', 'lost')
      ) scores WHERE rank = 1 ORDER BY amount DESC, level DESC, "finishedAt" ASC, id ASC LIMIT 50`;
        return rows;
    });
}
