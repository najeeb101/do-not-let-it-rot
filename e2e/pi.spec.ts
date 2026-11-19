import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { piDigits } from '../src/config/piDigits';

async function startGame(page: Page) {
  await page.goto('/');
  await page.getByRole('button', { name: /Pi Challenge/ }).click();
  await expect(page.getByTestId('ticker')).toBeVisible({ timeout: 5000 });
}

const pad = (page: Page) => page.getByRole('group', { name: 'Digit pad' });

test('clock waits for the first digit, then digits fill the ticker', async ({ page }) => {
  await startGame(page);
  await expect(page.getByText('Type the first digit to start the clock.')).toBeVisible();
  await page.waitForTimeout(1200);
  await expect(page.getByTestId('ticker')).toHaveAttribute('data-digits', '');
  await expect(page.getByText('30s')).toBeVisible();

  for (const d of piDigits.slice(0, 12)) await pad(page).getByRole('button', { name: d, exact: true }).click();
  await expect(page.getByTestId('ticker')).toHaveAttribute('data-digits', piDigits.slice(0, 12));
  await expect(page.getByTestId('digit-count')).toHaveText('12');
  await expect(page.getByText('Type the first digit to start the clock.')).toHaveCount(0);
  await expect(page.getByText('29s').or(page.getByText('30s'))).toBeVisible();
});

test('first wrong digit stops the run, shows the right one, and saves the score', async ({ page }) => {
  await startGame(page);
  await page.keyboard.type(piDigits.slice(0, 14));
  const wrong = piDigits[14] === '5' ? '6' : '5';
  await page.keyboard.type(wrong);
  await expect(page.getByTestId('wrong-digit')).toHaveText(wrong);
  await expect(page.getByTestId('pi-status')).toContainText(`You typed ${wrong}, it was ${piDigits[14]}`);
  await expect(page.getByText('Pi is irrational. So is that digit.')).toBeVisible();
  await expect(pad(page).getByRole('button', { name: '1', exact: true })).toBeDisabled();
  await expect(page.getByTestId('final-score')).toHaveText('14', { timeout: 5000 });
  await expect(page.getByText('NEW BEST')).toBeVisible();
  await page.getByRole('button', { name: 'Back to menu' }).click();
  await expect(page.getByText('digits', { exact: true })).toBeVisible();
});

test('ticker stays a single scrolling line that shows the latest digits', async ({ page }) => {
  await startGame(page);
  await page.keyboard.type(piDigits.slice(0, 40));
  const m = await page.getByTestId('ticker').evaluate((el) => ({
    scrollable: el.scrollWidth > el.clientWidth,
    atEnd: Math.abs(el.scrollWidth - el.clientWidth - el.scrollLeft) < 2,
    h: el.getBoundingClientRect().height,
  }));
  expect(m.scrollable).toBe(true);
  expect(m.atEnd).toBe(true);
  expect(m.h).toBeLessThan(80);
  const overflow = await page.evaluate(() => ({
    h: document.documentElement.scrollHeight - window.innerHeight,
    w: document.documentElement.scrollWidth - window.innerWidth,
  }));
  expect(overflow.h).toBeLessThanOrEqual(0);
  expect(overflow.w).toBeLessThanOrEqual(0);
});

test('has no backspace, OK or multiplier', async ({ page }) => {
  await startGame(page);
  await expect(page.getByRole('button', { name: 'Delete' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'OK' })).toHaveCount(0);
  await expect(page.getByLabel(/lives left/)).toHaveCount(0);
  await page.keyboard.type('1');
  await page.keyboard.press('Backspace');
  await expect(page.getByTestId('ticker')).toHaveAttribute('data-digits', '1');
});

test('pause stops the clock and resume continues', async ({ page }) => {
  await startGame(page);
  await page.keyboard.type('14');
  await page.getByRole('button', { name: 'Pause' }).click();
  await expect(page.getByRole('dialog', { name: 'Paused' })).toBeVisible();
  await page.getByRole('button', { name: 'Resume' }).click();
  await page.keyboard.type('1');
  await expect(page.getByTestId('ticker')).toHaveAttribute('data-digits', '141');
});
