import { expect, test } from '@playwright/test';

test('app loads', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle('Do Not Let It Rot');
  await expect(page.getByRole('heading', { name: 'Do Not Let It Rot' })).toBeVisible();
});
