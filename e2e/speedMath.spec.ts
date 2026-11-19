import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

function solve(text: string): number {
  const m = /^(\d+) (\+|−|×|÷) (\d+)$/.exec(text.trim());
  if (!m) throw new Error(`bad question: ${text}`);
  const a = Number(m[1]);
  const b = Number(m[3]);
  switch (m[2]) {
    case '+':
      return a + b;
    case '−':
      return a - b;
    case '×':
      return a * b;
    default:
      return a / b;
  }
}

async function startGame(page: Page) {
  await page.goto('/');
  await page.getByRole('button', { name: /Speed Math/ }).click();
  await expect(page.getByTestId('question')).toBeVisible({ timeout: 5000 });
}

async function tapNumber(page: Page, n: number) {
  for (const d of String(n)) {
    await page.getByRole('group', { name: 'Number pad' }).getByRole('button', { name: d, exact: true }).click();
  }
}

test('plays correct answers with the pad and ends after three misses', async ({ page }) => {
  await startGame(page);

  for (let i = 0; i < 3; i++) {
    const before = await page.getByTestId('question').innerText();
    await tapNumber(page, solve(before));
    await expect(page.getByRole('status')).toContainText('+');
    await expect(page.getByTestId('question')).not.toHaveText(before, { timeout: 3000 });
  }
  await expect(page.getByText('Score')).toBeVisible();

  for (let i = 0; i < 3; i++) {
    await expect(page.getByRole('status')).toHaveText('', { timeout: 3000 });
    await tapNumber(page, 999);
    await page.getByRole('button', { name: 'OK' }).click();
    if (i < 2) await expect(page.getByRole('status')).toContainText('=');
  }

  await expect(page.getByTestId('final-score')).toBeVisible({ timeout: 6000 });
  const score = await page.getByTestId('final-score').innerText();
  expect(Number(score)).toBeGreaterThan(0);
  await expect(page.getByText('NEW BEST')).toBeVisible();

  await page.reload();
  await expect(page.getByText(score, { exact: true })).toBeVisible();
});

test('keyboard input works', async ({ page }) => {
  await startGame(page);
  const q = await page.getByTestId('question').innerText();
  await page.keyboard.type(String(solve(q)));
  await expect(page.getByRole('status')).toContainText('+');
});

test('no scroll or overflow during play', async ({ page }) => {
  await startGame(page);
  const overflow = await page.evaluate(() => ({
    h: document.documentElement.scrollHeight - window.innerHeight,
    w: document.documentElement.scrollWidth - window.innerWidth,
  }));
  expect(overflow.h).toBeLessThanOrEqual(0);
  expect(overflow.w).toBeLessThanOrEqual(0);
  const box = await page.getByRole('button', { name: 'OK' }).boundingBox();
  expect(box).not.toBeNull();
  expect((box?.y ?? 0) + (box?.height ?? 0)).toBeLessThanOrEqual(page.viewportSize()?.height ?? 0);
});

test('pause freezes the game and resume continues', async ({ page }) => {
  await startGame(page);
  await page.getByRole('button', { name: 'Pause' }).click();
  await expect(page.getByRole('dialog', { name: 'Paused' })).toBeVisible();
  await page.getByRole('button', { name: 'Resume' }).click();
  await expect(page.getByTestId('question')).toBeVisible();
});
