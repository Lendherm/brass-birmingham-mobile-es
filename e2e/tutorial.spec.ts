import { expect, test, type Page } from '@playwright/test';
import { TUTORIAL_CHAPTERS } from '../src/engine/tutorial/steps';

async function prepareTutorial(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('bbsolo-tutorial-done', '1');
    localStorage.removeItem('bbsolo-save-v1');
  });
  await page.goto('/');
  await page.getByTestId('setup').getByTestId('tutorial-start').click();
  await expect(page.getByTestId('tutorial-coach')).toBeVisible();
}

test('tutorial shows chapter 1 intro', async ({ page }) => {
  await prepareTutorial(page);
  await expect(page.getByTestId('tutorial-coach')).toContainText('Cap. 1');
  await expect(page.getByTestId('tutorial-coach')).toContainText(TUTORIAL_CHAPTERS[0]);
});

test('tutorial chapter 1: continue through map intro', async ({ page }) => {
  await prepareTutorial(page);
  await page.getByTestId('tutorial-continue').click();
  await expect(page.getByTestId('tutorial-coach')).toContainText('Explora el mapa');
  await page.getByTestId('tutorial-continue').click();
  await expect(page.getByTestId('tutorial-coach')).toContainText('Construir');
});

test('all tutorial chapters are defined', async ({ page }) => {
  expect(TUTORIAL_CHAPTERS).toHaveLength(7);
  expect(TUTORIAL_CHAPTERS).toEqual([
    'Lo esencial',
    'Vender',
    'Desarrollar',
    'Préstamo',
    'Explorar',
    'Partida completa',
    'Coach y entrenamiento',
  ]);
  await page.goto('/');
});

test('first visit banner offers tutorial without forcing it', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.removeItem('bbsolo-tutorial-done');
    localStorage.removeItem('bbsolo-save-v1');
  });
  await page.goto('/');
  await expect(page.getByTestId('first-visit-banner')).toBeVisible({ timeout: 3000 });
  await page.getByTestId('first-visit-dismiss').click();
  await expect(page.getByTestId('first-visit-banner')).toHaveCount(0);
  await expect(page.getByTestId('setup')).toBeVisible();
  await expect(page.getByTestId('tutorial-coach')).toHaveCount(0);
});

test('accessibility large text toggle', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.removeItem('bbsolo-a11y-large'));
  await page.reload();
  await page.getByTestId('a11y-toggle').click();
  await expect(page.locator('html')).toHaveAttribute('data-a11y', 'large');
  await page.evaluate(async () => {
    const regs = await navigator.serviceWorker.getRegistrations();
    await Promise.all(regs.map((r) => r.unregister()));
  });
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-a11y', 'large');
});
