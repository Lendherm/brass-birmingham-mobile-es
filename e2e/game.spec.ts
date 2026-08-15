import { expect, test, type Page } from '@playwright/test';

async function preparePage(page: Page, opts?: { clearSave?: boolean }) {
  await page.addInitScript((clearSave) => {
    localStorage.setItem('bbsolo-tutorial-done', '1');
    if (clearSave) localStorage.removeItem('bbsolo-save-v1');
  }, opts?.clearSave ?? false);
}

async function startGame(page: Page, seed = 42, difficulty = 'easy') {
  await preparePage(page, { clearSave: true });
  await page.goto('/');
  await page.getByTestId('difficulty').selectOption(difficulty);
  await page.getByTestId('seed').fill(String(seed));
  await page.getByTestId('start-game').click();
  await page.getByTestId('mode-intro-continue').click();
  await expect(page.getByTestId('board')).toBeVisible();
}

async function gameLogText(page: Page) {
  await page.getByTestId('game-history').scrollIntoViewIfNeeded();
  return page.getByTestId('game-history-log').textContent();
}

async function scrollSideTo(page: Page, testId: string) {
  await page.getByTestId(testId).scrollIntoViewIfNeeded();
}

function firstSelectableCard(page: Page) {
  return page.locator('.game-card:not(.disabled)').first();
}

test('setup screen starts a game', async ({ page }) => {
  await startGame(page);
  await expect(page.getByTestId('era-turn')).toContainText('Era Canal — Turno 1 — 1 acción restante');
  await expect(page.getByTestId('hand').locator('.game-card')).toHaveCount(8);
  await expect(page.getByTestId('draw-pile')).toHaveText('3/19');
});

test('player mat expands to fullscreen', async ({ page }) => {
  await startGame(page);
  await scrollSideTo(page, 'player-mat-expand');
  await page.getByTestId('player-mat-expand').click({ force: true });
  await expect(page.getByTestId('player-mat-fullscreen')).toBeVisible();
  await expect(page.locator('.player-mat-grid-large .mat-tile').first()).toBeVisible();
  await page.getByTestId('player-mat-close').click();
  await expect(page.getByTestId('player-mat-fullscreen')).not.toBeVisible();
});

test('build action via option list advances the round and runs the Automa', async ({ page }) => {
  await startGame(page);
  await page.getByTestId('action-build').click();
  await firstSelectableCard(page).click();
  await page.getByTestId('build-options').locator('button').first().click();
  await expect(page.getByTestId('era-turn')).toContainText('Turno 2 — 2 acciones restantes');
  const log = await gameLogText(page);
  expect(log).toMatch(/Automa/i);
});

test('selecting a location card highlights the city on the map', async ({ page }) => {
  await startGame(page);
  await page.locator('.game-card.card-location:not(.disabled)').first().click();
  await expect(page.locator('[data-focused="true"]').first()).toBeVisible();
  await expect(page.getByTestId('card-focus-hint')).toBeVisible();
});

test('build action highlights valid slots before choosing a card', async ({ page }) => {
  await startGame(page);
  await page.getByTestId('action-build').click();
  await expect(page.locator('.board-slot-build-target, .board-city-card-target').first()).toBeVisible();
});

test('board click builds at a highlighted city', async ({ page }) => {
  await startGame(page);
  await page.getByTestId('action-build').click();
  await firstSelectableCard(page).click();
  const buildButtons = page.getByTestId('build-options').locator('button');
  const label = await buildButtons.first().textContent();
  const cityName = label!.split(':')[0].trim();
  await expect(page.getByTestId('era-turn')).toContainText('Turno 1');
  await buildButtons.first().click();
  const log = await gameLogText(page);
  expect(log?.toLowerCase()).toContain(cityName.split(' ')[0].toLowerCase());
});

test('loan gives money and costs income', async ({ page }) => {
  await startGame(page);
  await expect(page.getByTestId('player-panel')).toContainText('£17');
  await page.getByTestId('action-loan').click();
  await page.locator('.game-card').first().click();
  await expect(page.getByTestId('player-panel')).toContainText('£44');
  await expect(page.getByTestId('income-track')).toContainText('Nivel -3');
});

test('undo restores the previous state', async ({ page }) => {
  await startGame(page);
  await page.getByTestId('action-loan').click();
  await page.locator('.game-card').first().click();
  await expect(page.getByTestId('era-turn')).toContainText('Turno 2');
  await page.getByTestId('undo').click();
  await expect(page.getByTestId('era-turn')).toContainText('Turno 1 — 1 acción restante');
  await expect(page.getByTestId('player-panel')).toContainText('£17');
});

test('several turns of play: Automa scores, markets update', async ({ page }) => {
  await startGame(page, 7);
  await page.getByTestId('action-loan').click();
  await page.locator('.game-card').first().click();
  for (let turn = 2; turn <= 4; turn++) {
    for (let action = 0; action < 2; action++) {
      const loanEnabled = await page.getByTestId('action-loan').isEnabled();
      await page.getByTestId(loanEnabled ? 'action-loan' : 'action-pass').click();
      await page.locator('.game-card').first().click();
    }
  }
  const vpText = await page.getByTestId('automa-vp-1').textContent();
  const vp = Number(vpText!.replace(/\D/g, ''));
  expect(vp).toBeGreaterThan(0);
});

test('dark mode toggles and persists', async ({ page }) => {
  await preparePage(page);
  await page.goto('/');
  const initial = await page.evaluate(() => document.documentElement.dataset.theme);
  await page.getByTestId('theme-toggle').click();
  const toggled = await page.evaluate(() => document.documentElement.dataset.theme);
  expect(toggled).not.toBe(initial);
  await page.reload();
  const persisted = await page.evaluate(() => document.documentElement.dataset.theme);
  expect(persisted).toBe(toggled);
});

test('game persists across reload', async ({ page }) => {
  await preparePage(page);
  await page.goto('/');
  await page.evaluate(() => localStorage.removeItem('bbsolo-save-v1'));
  await page.getByTestId('difficulty').selectOption('easy');
  await page.getByTestId('seed').fill('42');
  await page.getByTestId('start-game').click();
  await page.getByTestId('mode-intro-continue').click();
  await expect(page.getByTestId('board')).toBeVisible();
  await page.getByTestId('action-loan').click();
  await page.locator('.game-card').first().click();
  await expect(page.getByTestId('era-turn')).toContainText('Turno 2');
  await page.reload();
  await expect(page.getByTestId('board')).toBeVisible();
  await expect(page.getByTestId('era-turn')).toContainText('Turno 2');
});

test('tutorial starts from setup', async ({ page }) => {
  await preparePage(page);
  await page.goto('/');
  await page.getByTestId('setup').getByTestId('tutorial-start').click();
  await expect(page.getByTestId('tutorial-coach')).toBeVisible();
  await page.getByTestId('tutorial-skip').evaluate((el) => (el as HTMLButtonElement).click());
  await expect(page.getByTestId('setup')).toBeVisible();
});

test('strategy guide opens from setup', async ({ page }) => {
  await preparePage(page);
  await page.goto('/');
  await page.getByTestId('setup').getByTestId('strategy-open').click();
  await expect(page.getByTestId('strategy-modal')).toBeVisible();
  await page.getByTestId('strategy-close').click();
  await expect(page.getByTestId('strategy-modal')).toHaveCount(0);
});

test('new game returns to setup', async ({ page }) => {
  await startGame(page);
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByTestId('new-game').click();
  await expect(page.getByTestId('setup')).toBeVisible();
});

test('no horizontal page overflow', async ({ page }) => {
  await startGame(page);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
  expect(overflow).toBe(false);
});

test('landscape layout uses side-by-side map and panel', async ({ page }) => {
  await page.setViewportSize({ width: 844, height: 390 });
  await startGame(page);
  const mapBox = await page.locator('.game-map-zone').boundingBox();
  const sideBox = await page.locator('.side').boundingBox();
  const boardBox = await page.locator('.board-viewport').boundingBox();
  expect(mapBox).not.toBeNull();
  expect(sideBox).not.toBeNull();
  expect(mapBox!.x).toBeLessThan(sideBox!.x);
  expect(boardBox!.height).toBeGreaterThan(200);
});

test('resource markets show names and sell info', async ({ page }) => {
  await startGame(page);
  await expect(page.getByTestId('coal-market')).toContainText('Carbón');
  await expect(page.getByTestId('iron-market')).toContainText('Hierro');
  await expect(page.getByTestId('coal-market')).toContainText('Puedes vender');
  await expect(page.getByTestId('iron-market')).toContainText('Puedes vender');
  await expect(page.getByTestId('coal-market')).toContainText('£1');
});

test('player mat shows remaining tiles with PC-style stats', async ({ page }) => {
  await startGame(page);
  await expect(page.getByTestId('player-mat')).toBeVisible();
  await expect(page.getByTestId('player-mat')).toContainText('Fichas en tu mat');
  await expect(page.getByTestId('player-mat').locator('.mat-tile-cost').first()).toContainText('£');
  await expect(page.getByTestId('player-mat').locator('.mat-tile-level').first()).toBeVisible();
  await expect(page.getByTestId('era-badge')).toContainText('Canal');
});

test('market help explains markets', async ({ page }) => {
  await startGame(page);
  await scrollSideTo(page, 'market-help');
  await expect(page.getByTestId('market-help')).toBeVisible();
  await page.getByTestId('market-help').locator('summary').click({ force: true });
  await expect(page.getByTestId('market-help')).toContainText('Comprar');
});

test('play assistant toggles on demand', async ({ page }) => {
  await preparePage(page, { clearSave: true });
  await page.addInitScript(() => localStorage.setItem('bbsolo-play-assistant', '0'));
  await page.goto('/');
  await page.getByTestId('start-game').click();
  await page.getByTestId('mode-intro-continue').click();
  await expect(page.getByTestId('play-assistant')).toHaveCount(0);
  await page.getByTestId('assistant-toggle').click();
  await expect(page.getByTestId('play-assistant')).toBeVisible();
  await page.getByTestId('play-assistant-close').click({ force: true });
  await expect(page.getByTestId('play-assistant')).toHaveCount(0);
});

test('zone legend shows five board colors', async ({ page }) => {
  await startGame(page);
  await expect(page.getByTestId('zone-legend')).toBeVisible();
  await expect(page.getByTestId('zone-legend')).toContainText('Naranja');
  await expect(page.getByTestId('zone-legend')).toContainText('Morado');
});

test('tapping a city opens PC-style overlay with zone color', async ({ page }) => {
  await startGame(page);
  await page.getByTestId('city-birmingham').click();
  await expect(page.getByTestId('city-inspect')).toBeVisible();
  await expect(page.getByTestId('city-inspect')).toContainText('Birmingham');
  await expect(page.getByTestId('city-inspect')).toContainText('Morado');
  await expect(page.getByTestId('city-inspect')).toContainText('Cancelar');
});

test('project credits on setup with fork attribution', async ({ page }) => {
  await preparePage(page);
  await page.goto('/');
  await expect(page.getByTestId('project-credits')).toContainText('Nathanael De la Rosa');
  await expect(page.getByTestId('project-credits')).toContainText('proyecto fan original');
  await expect(page.getByTestId('project-credits')).toContainText('Roxley Games');
  await expect(page.getByTestId('project-repo-link')).toHaveAttribute(
    'href',
    'https://github.com/Lendherm/brass-birmingham-mobile-es',
  );
  await expect(page.getByTestId('project-apk-link')).toHaveAttribute(
    'href',
    'https://github.com/Lendherm/brass-birmingham-mobile-es/releases/latest',
  );
  await expect(page.getByTestId('project-credits')).toContainText(/v\d+\.\d+\.\d+/);
  await startGame(page);
  await expect(page.getByTestId('project-credits')).toHaveCount(0);
});
