import { startGame } from '@/lib/server/game';
import { handle, player, sameOrigin } from '@/lib/server/http';
export const runtime = 'nodejs';
export async function POST(request: Request) { return handle(async () => { sameOrigin(request); return startGame((await player()).id); }); }
