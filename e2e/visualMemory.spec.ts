import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

async function startGame(page: Page) {
  await page.goto('/');
  await page.getByRole('button', { name: /Visual Memory/ }).click();
  await expect(page.getByTestId('round')).toBeVisible({ timeout: 5000 });
}

/** Wait for the show phase and read which tiles are lit (the only thing the player can see). */
async function readPattern(page: Page): Promise<number[]> {
  await page.locator('[data-testid=tile][data-state=lit]').first().waitFor({ timeout: 6000 });
  return page.locator('[data-testid=tile][data-state=lit]').evaluateAll((els) => els.map((e) => Number(e.getAttribute('data-index'))));
}

async function waitRecall(page: Page) {
  await expect(page.getByTestId('status')).toContainText('Your turn', { timeout: 6000 });
}

const tile = (page: Page, i: number) => page.locator(`[data-testid=tile][data-index="${i}"]`);

test('shows a pattern, then scores a correct recall and moves to round 2', async ({ page }) => {
  await startGame(page);
  const pattern = await readPattern(page);
  expect(pattern).toHaveLength(3);
  await waitRecall(page);
  expect(await page.locator('[data-testid=tile][data-state=lit]').count()).toBe(0);
  for (const i of pattern) await tile(page, i).click();
  await expect(page.getByTestId('status')).toContainText('+');
  await expect(page.getByTestId('round')).toHaveText('Round 2', { timeout: 4000 });
});

test('one wrong tap fails the round, shows the misses, and the level repeats', async ({ page }) => {
  await startGame(page);
  const pattern = await readPattern(page);
  await waitRecall(page);
  const wrong = [0, 1, 2, 3, 4, 5, 6, 7, 8].find((i) => !pattern.includes(i)) as number;
  await tile(page, wrong).click();
  await expect(page.getByTestId('status')).toContainText('Wrong tile');
  await expect(tile(page, wrong)).toHaveAttribute('data-state', 'wrong');
  await expect(page.locator('[data-testid=tile][data-state=missed]')).toHaveCount(3);
  await expect(page.getByText('Dashed tiles were yours to find.')).toBeVisible();
  await expect(page.getByTestId('round')).toHaveText('Round 1');
  await expect(page.getByTestId('status')).toContainText('Watch', { timeout: 4000 });
  expect(await page.locator('[data-testid=tile][data-state=lit]').count()).toBe(3);
});

test('three wrong taps end the game and save the score', async ({ page }) => {
  await startGame(page);
  for (let i = 0; i < 3; i++) {
    const pattern = await readPattern(page);
    await waitRecall(page);
    const wrong = [0, 1, 2, 3, 4, 5, 6, 7, 8].find((n) => !pattern.includes(n)) as number;
    await tile(page, wrong).click();
  }
  await expect(page.getByTestId('final-score')).toBeVisible({ timeout: 6000 });
  await expect(page.getByTestId('final-score')).toHaveText('0');
});

test('fits the screen with no overflow during play', async ({ page }) => {
  await startGame(page);
  await readPattern(page);
  const overflow = await page.evaluate(() => ({
    h: document.documentElement.scrollHeight - window.innerHeight,
    w: document.documentElement.scrollWidth - window.innerWidth,
  }));
  expect(overflow.h).toBeLessThanOrEqual(0);
  expect(overflow.w).toBeLessThanOrEqual(0);
  const last = await tile(page, 8).boundingBox();
  expect((last?.y ?? 0) + (last?.height ?? 0)).toBeLessThanOrEqual(page.viewportSize()?.height ?? 0);
});

test('pause during the show phase and resume restarts it in full', async ({ page }) => {
  await startGame(page);
  await readPattern(page);
  await page.getByRole('button', { name: 'Pause' }).click();
  await expect(page.getByRole('dialog', { name: 'Paused' })).toBeVisible();
  await page.getByRole('button', { name: 'Resume' }).click();
  await expect(page.locator('[data-testid=tile][data-state=lit]').first()).toBeVisible();
});

test('keyboard: arrow keys move between tiles and Enter taps', async ({ page }) => {
  await startGame(page);
  const pattern = await readPattern(page);
  await waitRecall(page);
  await tile(page, 0).focus();
  for (const target of pattern) {
    const cur = Number(await page.evaluate(() => document.activeElement?.getAttribute('data-index')));
    const dr = Math.floor(target / 3) - Math.floor(cur / 3);
    const dc = (target % 3) - (cur % 3);
    for (let k = 0; k < Math.abs(dr); k++) await page.keyboard.press(dr > 0 ? 'ArrowDown' : 'ArrowUp');
    for (let k = 0; k < Math.abs(dc); k++) await page.keyboard.press(dc > 0 ? 'ArrowRight' : 'ArrowLeft');
    await page.keyboard.press('Enter');
  }
  await expect(page.getByTestId('status')).toContainText('+');
});
