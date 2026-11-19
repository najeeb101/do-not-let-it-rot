import { expect, test } from '@playwright/test';
import { piDigits } from '../src/config/piDigits';

test('all three Home cards are playable', async ({ page }) => {
  await page.goto('/');
  for (const name of [/Visual Memory/, /Speed Math/, /Pi Challenge/]) {
    await expect(page.getByRole('button', { name })).toBeEnabled();
  }
});

test('settings: theme, toggles and credits', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Settings' }).click();
  await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();

  await page.getByRole('radio', { name: 'Dark' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.getByRole('radio', { name: 'Light' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.getByRole('radio', { name: 'System' }).click();
  await expect(page.locator('html')).not.toHaveAttribute('data-theme', /.+/);

  const sound = page.getByRole('switch', { name: 'Sound' });
  await expect(sound).toHaveAttribute('aria-checked', 'true');
  await sound.click();
  await expect(sound).toHaveAttribute('aria-checked', 'false');
  await page.reload();
  await page.getByRole('button', { name: 'Settings' }).click();
  await expect(page.getByRole('switch', { name: 'Sound' })).toHaveAttribute('aria-checked', 'false');

  await page.getByRole('button', { name: 'Credits' }).click();
  await expect(page.getByText('Concept by a friend')).toBeVisible();
  await expect(page.getByTestId('privacy')).toContainText('No accounts, no personal data.');
  await page.getByRole('button', { name: 'Back' }).click();
  await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
});

test('reset data uses an in-app dialog, cancel keeps scores, erase clears them and keeps settings', async ({ page }) => {
  let nativeDialog = false;
  page.on('dialog', (d) => {
    nativeDialog = true;
    void d.dismiss();
  });
  await page.goto('/');
  await page.getByRole('button', { name: /Pi Challenge/ }).click();
  await expect(page.getByTestId('ticker')).toBeVisible({ timeout: 5000 });
  await page.keyboard.type(piDigits.slice(0, 6));
  await page.keyboard.type(piDigits[6] === '5' ? '6' : '5');
  await expect(page.getByTestId('final-score')).toHaveText('6', { timeout: 6000 });
  await page.getByRole('button', { name: 'Back to menu' }).click();
  await page.getByRole('button', { name: 'Settings' }).click();
  await page.getByRole('radio', { name: 'Dark' }).click();

  await page.getByRole('button', { name: 'Reset data' }).click();
  const dialog = page.getByRole('alertdialog');
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Cancel' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);

  await page.getByRole('button', { name: 'Reset data' }).click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'Cancel' }).click();
  await page.getByRole('button', { name: 'Back' }).click();
  await expect(page.getByRole('button', { name: /Pi Challenge/ })).toContainText('6');

  await page.getByRole('button', { name: 'Settings' }).click();
  await page.getByRole('button', { name: 'Reset data' }).click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'Erase' }).click();
  await expect(page.getByText('Scores erased.')).toBeVisible();
  await expect(page.getByRole('radio', { name: 'Dark' })).toHaveAttribute('aria-checked', 'true');
  await page.getByRole('button', { name: 'Back' }).click();
  await expect(page.getByRole('button', { name: /Pi Challenge/ })).not.toContainText('digits');
  expect(nativeDialog).toBe(false);
});

test('works offline after the first load', async ({ page, context }) => {
  await page.goto('/');
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Do Not Let It Rot' })).toBeVisible();
  await page.getByRole('button', { name: /Speed Math/ }).click();
  await expect(page.getByTestId('question')).toBeVisible({ timeout: 5000 });
  await context.setOffline(false);
});

test('manifest has name, theme color and icons', async ({ request }) => {
  const res = await request.get('/manifest.webmanifest');
  expect(res.ok()).toBe(true);
  const m = await res.json();
  expect(m.name).toBe('Do Not Let It Rot');
  expect(m.theme_color).toBe('#0E1116');
  const sizes = m.icons.map((i: { sizes: string; purpose?: string }) => `${i.sizes}${i.purpose ? ':' + i.purpose : ''}`);
  expect(sizes).toEqual(expect.arrayContaining(['192x192', '512x512', '512x512:maskable']));
  for (const i of m.icons) expect((await request.get(i.src)).ok()).toBe(true);
});
