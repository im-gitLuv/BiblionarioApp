import { db } from '@/lib/db';
import { handle } from '@/lib/server/http';
export const runtime = 'nodejs';
export async function GET() {
    return handle(async () => {
        // Derive historical totals from finished games: no duplicate credit on retries.
        const rows = await db.$queryRaw<Array<{
            id: string;
            name: string;
            amount: number;
            level: number;
            outcome: string;
            date: Date;
            knowledgeCrowns: number;
            gamesPlayed: number;
        }>> `
      SELECT p.id, p.name, SUM(g.amount)::double precision AS amount,
        MAX(g.level)::integer AS level,
        CASE WHEN BOOL_OR(g.status = 'won') THEN 'won' ELSE 'walked' END AS outcome,
        MAX(g."finishedAt") AS date,
        COUNT(*) FILTER (WHERE g.status = 'won')::integer AS "knowledgeCrowns",
        COUNT(*)::integer AS "gamesPlayed"
      FROM "Game" g JOIN "Player" p ON p.id = g."playerId"
      WHERE g.status IN ('won', 'walked', 'lost')
      GROUP BY p.id, p.name
      ORDER BY amount DESC, "knowledgeCrowns" DESC, date ASC, p.id ASC LIMIT 50`;
        return rows;
    });
}
