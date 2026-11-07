import { test, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';

test('nombre, tres comodines, pausa persistente y nuevo reloj', async ({ page }, testInfo) => {
  if (process.env.BIBLIONARIO_INTEGRATION !== '1') throw new Error('Requiere PostgreSQL dedicado de pruebas.');
  const db = new PrismaClient();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  try {
    await page.goto('/');
    await page.getByRole('button', { name: 'Comenzar el camino' }).click();
    await expect(page.locator('#player')).toBeFocused();
    await expect(page.locator('#player')).toHaveClass(/name-attention/);
    await expect(page.locator('#player')).toBeInViewport();
    await page.locator('#player').fill('Revisión ' + testInfo.project.name);
    await page.getByRole('button', { name: 'Cómo jugar' }).click();
    await expect(page.getByText(/Corona del conocimiento/).first()).toBeVisible();
    await page.getByRole('button', { name: /Volver/ }).click();
    const started = page.waitForResponse(r => r.url().endsWith('/api/games') && r.request().method() === 'POST');
    await page.getByRole('button', { name: 'Comenzar el camino' }).click();
    const game = await (await started).json();
    expect(game.level).toBe(1);
    if (testInfo.project.name === 'mobile') {
      const tab = page.getByRole('button', { name: 'Abrir Escalera de Coronas' });
      await expect(tab).toBeVisible();
      const bounds = await tab.boundingBox();
      expect(Math.abs(bounds.x + bounds.width - page.viewportSize().width)).toBeLessThan(2);
      await tab.click();
      await expect(page.getByRole('dialog', { name: 'Escalera de Coronas' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Cerrar pestaña de Escalera' })).toBeVisible();
      await page.screenshot({ path: testInfo.outputPath('ladder-tab.png') });
      await page.getByRole('button', { name: 'Cerrar pestaña de Escalera' }).click();
      await expect(page.getByRole('dialog')).toHaveCount(0);
    }
    for (const [label, key] of [['Sabiduría', 'fifty'], ['Congregación', 'audience'], ['Voz profética', 'prophet']]) {
      const button = page.getByRole('button', { name: label, exact: true });
      await button.click();
      await expect(button).toHaveAttribute('aria-pressed', 'true');
      await expect(page.getByRole('region', { name: 'Mensaje del anfitrión' })).toContainText('¿Quieres usar este comodín?');
      await expect(page.getByRole('dialog')).toHaveCount(0);
      await page.getByRole('button', { name: 'Usar comodín' }).click();
      const dialog = page.getByRole('dialog');
      if (key === 'fifty') {
        await expect(page.getByRole('button', { name: 'Usar comodín' })).toHaveCount(0);
        await expect(button).toBeDisabled();
        await expect(dialog).toHaveCount(0);
        const updated = await db.game.findUniqueOrThrow({ where: { id: game.id } });
        expect(updated.removed).toHaveLength(2);
        for (const index of updated.removed) await expect(page.getByRole('button', { name: new RegExp('^' + 'ABCD'[index] + ' ') })).toBeDisabled();
        await page.screenshot({ path: testInfo.outputPath('fifty.png'), fullPage: true });
        continue;
      }
      await expect(dialog).toBeVisible();
      await expect(dialog.getByRole('timer')).toBeVisible();
      expect(await dialog.evaluate(el => el.getBoundingClientRect().width)).toBeLessThanOrEqual(page.viewportSize().width);
      await expect(dialog.getByRole('timer')).toHaveClass(/rounded-full/);
      await expect(dialog.getByRole('timer')).toHaveText(/^\d+$/);
      if (key === 'audience') await expect(dialog).toContainText('%');
      if (key === 'prophet') await expect(dialog).toContainText('Mi consejo es');
      await page.screenshot({ path: testInfo.outputPath(key + '.png'), fullPage: true });
      await page.getByRole('button', { name: 'Volver a la pregunta' }).click();
      await expect(dialog).toHaveCount(0);
      await expect(button).toBeDisabled();
    }
    const stored = await db.game.findUniqueOrThrow({ where: { id: game.id } });
    const correct = stored.rounds[0].answer;
    await page.getByRole('button', { name: new RegExp('^' + 'ABCD'[correct] + ' ') }).click();
    await page.getByRole('button', { name: /Respuesta definitiva/ }).click();
    await expect(page.getByRole('button', { name: 'Siguiente pregunta' })).toBeVisible();
    await expect(page.getByRole('timer')).toHaveAttribute('aria-label', 'Reloj detenido para leer el resultado');
    await db.game.update({ where: { id: game.id }, data: { deadline: new Date(Date.now() - 1000) } });
    await page.reload();
    await expect(page.locator('#player')).toHaveValue('Revisión ' + testInfo.project.name);
    await page.getByRole('button', { name: 'Comenzar el camino' }).click();
    await expect(page.getByRole('button', { name: 'Siguiente pregunta' })).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath('pause.png'), fullPage: true });
    await page.getByRole('button', { name: 'Siguiente pregunta' }).click();
    await expect(page.getByRole('button', { name: 'Siguiente pregunta' })).toHaveCount(0);
    const next = await db.game.findUniqueOrThrow({ where: { id: game.id } });
    expect(next.level).toBe(2);
    expect(next.deadline.getTime()).toBeGreaterThan(Date.now() + 40000);
    const wrong = (next.rounds[1].answer + 1) % 4;
    await page.getByRole('button', { name: new RegExp('^' + 'ABCD'[wrong] + ' ') }).click();
    await page.getByRole('button', { name: /Respuesta definitiva/ }).click();
    await expect(page.getByRole('button', { name: 'Ver resultado' })).toBeVisible();
    await page.getByRole('button', { name: 'Ver resultado' }).click();
    await expect(page.getByRole('button', { name: 'Ver resultado' })).toHaveCount(0);
    expect(errors).toEqual([]);
  } finally { await db.$disconnect(); }
});
