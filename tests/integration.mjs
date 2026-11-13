// Requires a migrated, seeded TEST database. Never point this at production.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { PrismaClient } from '@prisma/client';
const base = 'http://localhost:3100';
// Espera a que el servidor de pruebas libere el puerto antes del siguiente test.
const stopServer = (server) => new Promise(resolve => {
  server.kill();
  if (server.exitCode !== null) return resolve();
  server.once('exit', resolve);
  setTimeout(resolve, 2000);
});
test('API: identidad, soluciones privadas, concurrencia, comodines, victoria y vencimiento', async () => {
  if (process.env.BIBLIONARIO_INTEGRATION !== '1') throw new Error('Configura BIBLIONARIO_INTEGRATION=1 y una base de pruebas dedicada.');
  const server = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '-p', '3100'], { stdio: 'ignore', env: process.env });
  const db = new PrismaClient();
  const players = [];
  try {
    let ready = false;
    for (let i = 0; i < 100; i++) {
      try { if ((await fetch(base + '/api')).ok) { ready = true; break; } } catch {}
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    assert.ok(ready, 'La aplicación debe iniciar');
    async function request(path, body, cookie = '', origin = base) {
      const response = await fetch(base + path, { method: body === undefined ? 'GET' : 'POST', headers: { Origin: origin, Cookie: cookie, 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) });
      return { status: response.status, data: await response.json(), cookie: response.headers.get('set-cookie')?.split(';')[0] };
    }
    assert.equal((await request('/api/player')).status, 401);
    assert.equal((await request('/api/player', { name: 'Intruso' }, '', 'https://other.example')).status, 403);
    const profile = await request('/api/player', { name: 'Prueba API' });
    assert.equal(profile.status, 200); assert.ok(profile.cookie);
    const cookie = profile.cookie;
    let game = (await request('/api/games', {}, cookie)).data;
    assert.equal(game.level, 1); assert.equal(game.question.options.length, 4);
    assert.equal('answer' in game.question, false); assert.equal('rounds' in game, false);
    const stored = await db.game.findUniqueOrThrow({ where: { id: game.id } }); players.push(stored.playerId);
    assert.equal((await request('/api/games/' + game.id)).status, 401);
    const other = await request('/api/player', { name: 'Otra prueba' });
    const otherGame = (await request('/api/games', {}, other.cookie)).data;
    players.push((await db.game.findUniqueOrThrow({ where: { id: otherGame.id } })).playerId);
    assert.equal((await request('/api/games/' + game.id, undefined, other.cookie)).status, 404);
    assert.equal((await request('/api/games/' + game.id, { action: 'answer', version: game.version, option: 0, amount: 1000000 }, cookie)).status, 400);
    const simultaneous = await Promise.all([0, 1].map(() => request('/api/games/' + game.id, { action: 'fifty', version: game.version }, cookie)));
    assert.deepEqual(simultaneous.map(r => r.status).sort(), [200, 409]);
    game = simultaneous.find(r => r.status === 200).data.game;
    assert.equal(game.removed.length, 2);
    assert.equal((await request('/api/games/' + game.id, { action: 'fifty', version: game.version }, cookie)).status, 400);
    for (const action of ['audience', 'prophet']) {
      const result = await request('/api/games/' + game.id, { action, version: game.version }, cookie);
      assert.equal(result.status, 200); game = result.data.game;
      if (action === 'audience') assert.equal(result.data.hint.votes.reduce((a, b) => a + b, 0), 100);
    }
    assert.equal((await request('/api/games/' + game.id, { action: 'next', version: game.version }, cookie)).status, 400);
    for (let level = 1; level <= 15; level++) {
      const result = await request('/api/games/' + game.id, { action: 'answer', version: game.version, option: stored.rounds[level - 1].answer }, cookie);
      assert.equal(result.status, 200); assert.equal(result.data.reveal.correct, true); game = result.data.game;
      if (level < 15) {
        assert.equal(game.level, level);
        assert.equal(game.deadline, null);
        assert.equal(game.review.correct, true);
        const recovered = (await request('/api/games/' + game.id, undefined, cookie)).data;
        assert.deepEqual(recovered.review, game.review);
        assert.equal((await request('/api/games/' + game.id, { action: 'answer', version: game.version, option: 0 }, cookie)).status, 400);
        await db.game.update({ where: { id: game.id }, data: { deadline: new Date(Date.now() - 1000) } });
        const advanced = await request('/api/games/' + game.id, { action: 'next', version: game.version }, cookie);
        assert.equal(advanced.status, 200);
        game = advanced.data.game;
        assert.equal(game.level, level + 1);
        assert.equal(game.review, undefined);
        assert.ok(new Date(game.deadline).getTime() > Date.now() + 40000);
      }
    }
    assert.equal(game.result.outcome, 'won'); assert.equal(game.amount, 1000000);
    assert.equal(game.result.siclos, 183); // 175 base + 8 del bono de racha inicial
    assert.equal(game.result.lifelinesUsed, 3);
    assert.ok((await request('/api/leaderboard')).data.some(row => row.id === stored.playerId && row.amount === 1000000 && row.knowledgeCrowns === 1 && row.gamesPlayed === 1));
    const replay = await request('/api/games/' + game.id, { action: 'answer', version: 0, option: 0 }, cookie);
    assert.equal(replay.data.game.amount, 1000000);
    assert.equal(replay.data.game.result.siclos, 183); // releer una partida terminada no vuelve a pagar
    game = (await request('/api/games', {}, cookie)).data;
    const second = await db.game.findUniqueOrThrow({ where: { id: game.id } });
    for (let level = 1; level <= 15; level++) {
      const response = await request('/api/games/' + game.id, { action: 'answer', version: game.version, option: second.rounds[level - 1].answer }, cookie);
      assert.equal(response.status, 200);
      game = response.data.game;
      if (level < 15) game = (await request('/api/games/' + game.id, { action: 'next', version: game.version }, cookie)).data.game;
    }
    assert.equal(game.result.outcome, 'won');
    assert.equal(game.result.siclos, 183); // misma jornada: la racha se mantiene y el pago no se duplica
    game = (await request('/api/games', {}, cookie)).data;
    await db.game.update({ where: { id: game.id }, data: { deadline: new Date(Date.now() - 1000) } });
    const timeout = await request('/api/games/' + game.id, { action: 'timeout', version: game.version }, cookie);
    assert.equal(timeout.data.game.result.outcome, 'lost'); assert.equal(timeout.data.game.amount, 0);
    assert.equal(timeout.data.game.result.siclos, 0); // falló en el escalón 1: sin escalones completados
    game = (await request('/api/games', {}, cookie)).data;
    const retired = await request('/api/games/' + game.id, { action: 'walk', version: game.version }, cookie);
    assert.equal(retired.data.game.result.outcome, 'walked'); assert.equal(retired.data.game.amount, 0);
    assert.equal(retired.data.game.result.siclos, 0);
    const historical = (await request('/api/leaderboard')).data.find(row => row.id === stored.playerId);
    assert.equal(historical.amount, 2000000);
    assert.equal(historical.knowledgeCrowns, 2);
    assert.equal(historical.gamesPlayed, 4);
    // Tesoro del perfil: dos victorias pagan 183 cada una y la racha sigue en su primer día.
    const wallet = (await request('/api/player', undefined, cookie)).data;
    assert.equal(wallet.siclos, 366);
    assert.equal(wallet.streak, 1);
    assert.equal(wallet.bestStreak, 1);
  } finally {
    if (players.length) { await db.game.deleteMany({ where: { playerId: { in: players } } }); await db.player.deleteMany({ where: { id: { in: players } } }); }
    await db.$disconnect(); await stopServer(server);
  }
});

test('API: perfiles — etiqueta única, nombres repetidos y cambio de jugador', async () => {
  if (process.env.BIBLIONARIO_INTEGRATION !== '1') throw new Error('Configura BIBLIONARIO_INTEGRATION=1 y una base de pruebas dedicada.');
  const server = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '-p', '3100'], { stdio: 'ignore', env: process.env });
  const db = new PrismaClient();
  const tags = [];
  try {
    let ready = false;
    for (let i = 0; i < 100; i++) {
      try { if ((await fetch(base + '/api')).ok) { ready = true; break; } } catch {}
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    assert.ok(ready, 'La aplicación debe iniciar');
    async function request(path, body, cookie = '', origin = base) {
      const response = await fetch(base + path, { method: body === undefined ? 'GET' : 'POST', headers: { Origin: origin, Cookie: cookie, 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) });
      return { status: response.status, data: await response.json(), cookie: response.headers.get('set-cookie')?.split(';')[0] };
    }
    // Dos navegadores distintos con el mismo nombre: perfiles aparte,
    // etiquetas distintas y ambas visibles en la clasificación.
    const luisA = await request('/api/player', { name: 'Luis' });
    assert.equal(luisA.status, 200);
    assert.match(luisA.data.tag, /^[0-9A-F]{4}$/);
    const luisB = await request('/api/player', { name: 'Luis' });
    assert.equal(luisB.status, 200);
    assert.notEqual(luisB.cookie, luisA.cookie);
    assert.notEqual(luisB.data.tag, luisA.data.tag);
    tags.push(luisA.data.tag, luisB.data.tag);
    // GET devuelve la etiqueta del perfil actual.
    assert.equal((await request('/api/player', undefined, luisA.cookie)).data.tag, luisA.data.tag);
    // Ambos terminan una partida para aparecer en la clasificación.
    for (const luis of [luisA, luisB]) {
      const game = (await request('/api/games', {}, luis.cookie)).data;
      const retired = await request('/api/games/' + game.id, { action: 'walk', version: game.version }, luis.cookie);
      assert.equal(retired.status, 200);
    }
    const board = (await request('/api/leaderboard')).data;
    // Ambos perfiles aparecen en la clasificación, cada uno con su etiqueta:
    // así se distinguen los nombres repetidos aunque existan otros previos.
    const mine = board.filter(row => row.tag === luisA.data.tag || row.tag === luisB.data.tag);
    assert.equal(mine.length, 2);
    assert.ok(mine.every(row => row.name === 'Luis'));
    // Retirarse también cuenta como jornada jugada para la racha, aunque no emita Siclos.
    const walletA = (await request('/api/player', undefined, luisA.cookie)).data;
    assert.equal(walletA.streak, 1);
    assert.equal(walletA.siclos, 0);
    // Renombrar sin newProfile conserva el perfil (misma etiqueta).
    const renamed = await request('/api/player', { name: 'Luis Miguel' }, luisA.cookie);
    assert.equal(renamed.status, 200);
    assert.equal(renamed.data.tag, luisA.data.tag);
    // newProfile en el mismo navegador crea un perfil aparte y no toca el anterior.
    const fresh = await request('/api/player', { name: 'Ana', newProfile: true }, luisA.cookie);
    assert.equal(fresh.status, 200);
    assert.notEqual(fresh.data.tag, luisA.data.tag);
    tags.push(fresh.data.tag);
    assert.equal((await db.player.findUniqueOrThrow({ where: { tag: fresh.data.tag } })).name, 'Ana');
    assert.equal((await db.player.findUniqueOrThrow({ where: { tag: luisA.data.tag } })).name, 'Luis Miguel');
    // El parámetro desconocido sigue rechazándose.
    assert.equal((await request('/api/player', { name: 'X', intruso: true })).status, 400);
  } finally {
    if (tags.length) { const ids = await db.player.findMany({ where: { tag: { in: tags } }, select: { id: true } }); await db.game.deleteMany({ where: { playerId: { in: ids.map(p => p.id) } } }); await db.player.deleteMany({ where: { id: { in: ids.map(p => p.id) } } }); }
    await db.$disconnect(); await stopServer(server);
  }
});
