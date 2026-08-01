import { test, expect } from '@playwright/test';
test('homepage smoke test', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Joel Talargie Academy' })).toBeVisible();
});
