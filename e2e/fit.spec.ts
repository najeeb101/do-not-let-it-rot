import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { piDigits } from '../src/config/piDigits';

/** No page scroll, no clipped screen content, nothing outside the viewport. */
async function expectFits(page: Page, label: string) {
  const m = await page.evaluate(() => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const screen = document.querySelector('.screen');
    const outside: string[] = [];
    document.querySelectorAll('body *').forEach((el) => {
      if (el.closest('[data-testid="ticker"]') || el.closest('svg')) return;
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return;
      if (r.right > vw + 1 || r.left < -1 || r.bottom > vh + 1) outside.push(`${el.tagName}.${String(el.className).slice(0, 40)}`);
    });
    return {
      pageH: document.documentElement.scrollHeight - vh,
      pageW: document.documentElement.scrollWidth - vw,
      screenH: screen ? screen.scrollHeight - screen.clientHeight : 0,
      screenW: screen ? screen.scrollWidth - screen.clientWidth : 0,
      outside,
    };
  });
  expect(m.pageH, `${label} page height`).toBeLessThanOrEqual(0);
  expect(m.pageW, `${label} page width`).toBeLessThanOrEqual(0);
  expect(m.screenH, `${label} screen clipped vertically`).toBeLessThanOrEqual(0);
  expect(m.screenW, `${label} screen clipped horizontally`).toBeLessThanOrEqual(0);
  expect(m.outside, `${label} elements outside viewport`).toEqual([]);
}

for (const scheme of ['light', 'dark'] as const) {
  test.describe(scheme, () => {
    test.use({ colorScheme: scheme });

    test('home, settings, dialog, credits fit', async ({ page }) => {
      await page.goto('/');
      await expect(page.getByRole('heading', { name: 'Do Not Let It Rot' })).toBeVisible();
      await expectFits(page, 'home');
      await page.getByRole('button', { name: 'Settings' }).click();
      await expectFits(page, 'settings');
      await page.getByRole('button', { name: 'Reset data' }).click();
      await expectFits(page, 'confirm dialog');
      await page.keyboard.press('Escape');
      await page.getByRole('button', { name: 'Credits' }).click();
      await expectFits(page, 'credits');
    });

    test('speed math countdown, play, pause fit', async ({ page }) => {
      await page.goto('/');
      await page.getByRole('button', { name: /Speed Math/ }).click();
      await expectFits(page, 'speed math countdown');
      await expect(page.getByTestId('question')).toBeVisible({ timeout: 5000 });
      await expectFits(page, 'speed math play');
      await page.getByRole('button', { name: 'Pause' }).click();
      await expectFits(page, 'speed math pause');
    });

    test('visual memory show, recall, feedback fit', async ({ page }) => {
      await page.goto('/');
      await page.getByRole('button', { name: /Visual Memory/ }).click();
      await expect(page.getByTestId('tile').first()).toBeVisible({ timeout: 5000 });
      await expectFits(page, 'visual memory show');
      await expect(page.getByTestId('status')).toContainText('Your turn', { timeout: 8000 });
      await expectFits(page, 'visual memory recall');
      await page.getByTestId('tile').first().click();
      await page.getByTestId('tile').nth(1).click();
      await page.getByTestId('tile').nth(2).click();
      await expectFits(page, 'visual memory feedback');
    });

    test('pi start, typing, wrong digit and game over fit', async ({ page }) => {
      await page.goto('/');
      await page.getByRole('button', { name: /Pi Challenge/ }).click();
      await expectFits(page, 'pi countdown');
      await expect(page.getByTestId('ticker')).toBeVisible({ timeout: 5000 });
      await expectFits(page, 'pi ready');
      await page.keyboard.type(piDigits.slice(0, 60));
      await expectFits(page, 'pi typing');
      await page.keyboard.type(piDigits[60] === '5' ? '6' : '5');
      await expect(page.getByTestId('wrong-digit')).toBeVisible();
      await expectFits(page, 'pi end');
      await expect(page.getByTestId('final-score')).toBeVisible({ timeout: 5000 });
      await expectFits(page, 'game over');
    });
  });
}

test('keyboard: speed math accepts digits, Backspace and Enter', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /Speed Math/ }).click();
  const q = page.getByTestId('question');
  await expect(q).toBeVisible({ timeout: 5000 });
  const m = /^(\d+) (\+|−|×|÷) (\d+)$/.exec((await q.innerText()).trim());
  if (!m) throw new Error('bad question');
  const a = Number(m[1]);
  const b = Number(m[3]);
  const ans = m[2] === '+' ? a + b : m[2] === '−' ? a - b : m[2] === '×' ? a * b : a / b;
  await page.keyboard.type('9');
  await page.keyboard.press('Backspace');
  await page.keyboard.type(String(ans));
  await page.keyboard.press('Enter');
  await expect(page.getByRole('status')).toContainText('+');
});
