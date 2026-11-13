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
    if (players.length) { await db.purchase.deleteMany({ where: { playerId: { in: players } } }); await db.game.deleteMany({ where: { playerId: { in: players } } }); await db.player.deleteMany({ where: { id: { in: players } } }); }
    await db.$disconnect(); await stopServer(server);
  }
});

test('API: el Gazofilacio — tienda, bendiciones y Redención de Jonás', async () => {
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
    const profile = await request('/api/player', { name: 'Ofrendante' });
    assert.equal(profile.status, 200);
    const cookie = profile.cookie;

    // ── G1: victoria limpia que llena el arca (175 + 8 de racha) ──
    let game = (await request('/api/games', {}, cookie)).data;
    let stored = await db.game.findUniqueOrThrow({ where: { id: game.id } });
    players.push(stored.playerId);
    for (let level = 1; level <= 15; level++) {
      const response = await request('/api/games/' + game.id, { action: 'answer', version: game.version, option: stored.rounds[level - 1].answer }, cookie);
      assert.equal(response.status, 200);
      game = response.data.game;
      if (level < 15) game = (await request('/api/games/' + game.id, { action: 'next', version: game.version }, cookie)).data.game;
    }
    assert.equal(game.result.outcome, 'won');
    let wallet = (await request('/api/player', undefined, cookie)).data;
    assert.equal(wallet.siclos, 183);

    // ── Tienda: la vista abre vacía y las bendiciones no se compran aquí ──
    const store0 = (await request('/api/store', undefined, cookie)).data;
    assert.equal(store0.siclos, 183);
    assert.deepEqual(store0.owned, []);
    assert.equal(store0.equippedMarco, null);
    assert.equal((await request('/api/store', { action: 'comprar', item: 'lampara' }, cookie)).status, 400); // las bendiciones se ofrendan en partida
    assert.equal((await request('/api/store', { action: 'comprar', item: 'clave:intrusa' }, cookie)).status, 400);

    // ── G2: la Lámpara cobra 10 y persiste la referencia; el Sol suma 15 s ──
    game = (await request('/api/games', {}, cookie)).data;
    stored = await db.game.findUniqueOrThrow({ where: { id: game.id } });
    const lamp = await request('/api/games/' + game.id, { action: 'lampara', version: game.version }, cookie);
    assert.equal(lamp.status, 200);
    game = lamp.data.game; // sincroniza la versión tras la Lámpara
    assert.equal(lamp.data.game.question.reference, stored.rounds[0].reference);
    assert.deepEqual(lamp.data.game.bendiciones, ['lampara']);
    assert.equal(lamp.data.game.wallet, 173); // 183 − 10
    // La revelación persiste: releer la partida la mantiene.
    assert.equal((await request('/api/games/' + game.id, undefined, cookie)).data.question.reference, stored.rounds[0].reference);
    assert.equal((await request('/api/games/' + game.id, { action: 'lampara', version: game.version }, cookie)).status, 400);
    for (let uses = 1; uses <= 3; uses++) {
      const before = new Date((await db.game.findUniqueOrThrow({ where: { id: game.id } })).deadline).getTime();
      const sol = await request('/api/games/' + game.id, { action: 'sol', version: game.version }, cookie);
      assert.equal(sol.status, 200);
      const after = new Date((await db.game.findUniqueOrThrow({ where: { id: game.id } })).deadline).getTime();
      assert.equal(after - before, 15000);
      assert.equal(sol.data.game.wallet, 173 - 15 * uses);
      game = sol.data.game;
    }
    assert.deepEqual(game.bendiciones, ['lampara', 'sol', 'sol', 'sol']);
    const lateSol = await request('/api/games/' + game.id, { action: 'sol', version: game.version }, cookie);
    assert.equal(lateSol.status, 400);
    assert.match(lateSol.data.error, /3 veces/); // el servidor interpola el dígito: ${SOL_MAX_USES}
    wallet = (await request('/api/player', undefined, cookie)).data;
    assert.equal(wallet.siclos, 128); // 183 − 10 − 45
    // El historial del Gazofilacio registra cada ofrenda con su partida.
    const history = (await request('/api/store', undefined, cookie)).data.history;
    assert.deepEqual(history.map(row => row.item).slice(0, 4), ['sol', 'sol', 'sol', 'lampara']);
    assert.ok(history.slice(0, 4).every(row => row.gameId === game.id));

    // ── G3: caer en el escalón 3, redimir y volver a caer es derrota definitiva ──
    game = (await request('/api/games', {}, cookie)).data;
    stored = await db.game.findUniqueOrThrow({ where: { id: game.id } });
    const originalThird = stored.rounds[2].id;
    for (let level = 1; level <= 2; level++) {
      const answered = await request('/api/games/' + game.id, { action: 'answer', version: game.version, option: stored.rounds[level - 1].answer }, cookie);
      assert.equal(answered.status, 200);
      game = answered.data.game; // sincroniza la versión antes del next
      game = (await request('/api/games/' + game.id, { action: 'next', version: game.version }, cookie)).data.game;
    }
    const firstFall = await request('/api/games/' + game.id, { action: 'answer', version: game.version, option: (stored.rounds[2].answer + 1) % 4 }, cookie);
    assert.equal(firstFall.data.game.result.outcome, 'lost');
    assert.equal(firstFall.data.game.result.level, 3);
    assert.equal(firstFall.data.game.result.canRedeem, true);
    assert.equal(firstFall.data.game.result.siclos, 10); // dos escalones vencidos
    wallet = (await request('/api/player', undefined, cookie)).data;
    assert.equal(wallet.siclos, 138);
    const reopened = await request('/api/games/' + game.id, { action: 'redencion', version: firstFall.data.game.result.version }, cookie);
    assert.equal(reopened.status, 200);
    const rg = reopened.data.game;
    assert.equal(rg.result, null);
    assert.equal(rg.level, 3);
    assert.equal(rg.removed.length, 0);
    // G3 corre sobre la partida de G2 (el servidor reanuda la activa, correcto):
    // sus bendiciones previas se conservan y la Redención solo añade la suya.
    assert.deepEqual(rg.bendiciones, ['lampara', 'sol', 'sol', 'sol', 'redencion']);
    // Pregunta fresca del mismo escalón: distinta de la que causó la caída.
    stored = await db.game.findUniqueOrThrow({ where: { id: game.id } });
    assert.notEqual(stored.rounds[2].id, originalThird);
    wallet = (await request('/api/player', undefined, cookie)).data;
    assert.equal(wallet.siclos, 93); // 138 − 45
    // El refugio conservado: la derrota en el 3 pagó 0 Coronas y así continúa.
    assert.equal(rg.amount, 0);
    // Caer de nuevo: sin segunda Redención y sin doble pago de escalones.
    const secondFall = await request('/api/games/' + game.id, { action: 'answer', version: rg.version, option: (stored.rounds[2].answer + 1) % 4 }, cookie);
    assert.equal(secondFall.data.game.result.outcome, 'lost');
    assert.equal(secondFall.data.game.result.canRedeem, false);
    assert.equal(secondFall.data.game.result.siclos, 10); // libro contable: no se duplica
    assert.equal((await request('/api/player', undefined, cookie)).data.siclos, 93);
    assert.equal((await request('/api/games/' + game.id, { action: 'redencion', version: secondFall.data.game.result.version }, cookie)).status, 400);

    // ── G4: victoria tras la Redención — el cierre acredita la diferencia ──
    game = (await request('/api/games', {}, cookie)).data;
    stored = await db.game.findUniqueOrThrow({ where: { id: game.id } });
    for (let level = 1; level <= 2; level++) {
      const answered = await request('/api/games/' + game.id, { action: 'answer', version: game.version, option: stored.rounds[level - 1].answer }, cookie);
      assert.equal(answered.status, 200);
      game = answered.data.game; // sincroniza la versión antes del next
      game = (await request('/api/games/' + game.id, { action: 'next', version: game.version }, cookie)).data.game;
    }
    const fall = await request('/api/games/' + game.id, { action: 'answer', version: game.version, option: (stored.rounds[2].answer + 1) % 4 }, cookie);
    assert.equal(fall.data.game.result.canRedeem, true);
    const reopened2 = await request('/api/games/' + game.id, { action: 'redencion', version: fall.data.game.result.version }, cookie);
    assert.equal(reopened2.status, 200);
    const wrounds = (await db.game.findUniqueOrThrow({ where: { id: game.id } })).rounds;
    game = reopened2.data.game;
    for (let level = 3; level <= 15; level++) {
      const response = await request('/api/games/' + game.id, { action: 'answer', version: game.version, option: wrounds[level - 1].answer }, cookie);
      assert.equal(response.status, 200);
      game = response.data.game;
      if (level < 15) game = (await request('/api/games/' + game.id, { action: 'next', version: game.version }, cookie)).data.game;
    }
    assert.equal(game.result.outcome, 'won');
    assert.equal(game.result.siclos, 183); // emisión total del recorrido, sin recargo
    wallet = (await request('/api/player', undefined, cookie)).data;
    assert.equal(wallet.siclos, 231); // 93 + 10 (caída) − 45 (redención) + 173 (diferencia de la corona)

    // ── G5: caer en el escalón 1 no admite Redención ──
    game = (await request('/api/games', {}, cookie)).data;
    await db.game.update({ where: { id: game.id }, data: { deadline: new Date(Date.now() - 1000) } });
    const instant = await request('/api/games/' + game.id, { action: 'timeout', version: game.version }, cookie);
    assert.equal(instant.data.game.result.outcome, 'lost');
    assert.equal(instant.data.game.result.level, 1);
    assert.equal(instant.data.game.result.canRedeem, false);
    assert.equal((await request('/api/games/' + game.id, { action: 'redencion', version: instant.data.game.result.version }, cookie)).status, 400);

    // ── Tienda: compra y equipado del marco, con rechazos limpios ──
    const bought = await request('/api/store', { action: 'comprar', item: 'marco:cedro' }, cookie);
    assert.equal(bought.status, 200);
    assert.equal(bought.data.siclos, 131); // 231 − 100
    assert.ok(bought.data.owned.includes('marco:cedro'));
    assert.equal((await request('/api/store', { action: 'comprar', item: 'marco:cedro' }, cookie)).status, 400); // ya es tuyo
    const poor = await request('/api/store', { action: 'comprar', item: 'marco:zafiro' }, cookie);
    assert.equal(poor.status, 400);
    assert.match(poor.data.error, /faltan 169/); // 300 − 131
    assert.equal((await request('/api/store', { action: 'equipar', item: 'titulo:bereano' }, cookie)).status, 400); // sin comprar
    assert.equal((await request('/api/store', { action: 'equipar', item: 'marco:cedro' }, cookie)).data.equippedMarco, 'marco:cedro');
    wallet = (await request('/api/player', undefined, cookie)).data;
    assert.equal(wallet.equippedMarco, 'marco:cedro');
    // Quitar y volver a equipar: la propiedad persiste.
    assert.equal((await request('/api/store', { action: 'quitar', item: 'marco:cedro' }, cookie)).data.equippedMarco, null);
    assert.equal((await request('/api/store', { action: 'equipar', item: 'marco:cedro' }, cookie)).data.equippedMarco, 'marco:cedro');

    // La clasificación del Salón entrega los cosméticos equipados.
    const board = (await request('/api/leaderboard')).data.find(row => row.id === players[0]);
    assert.equal(board.equippedMarco, 'marco:cedro');
    assert.equal(board.equippedTitulo, null);
  } finally {
    if (players.length) { await db.purchase.deleteMany({ where: { playerId: { in: players } } }); await db.game.deleteMany({ where: { playerId: { in: players } } }); await db.player.deleteMany({ where: { id: { in: players } } }); }
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
