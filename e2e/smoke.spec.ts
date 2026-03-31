import { expect, test } from '@playwright/test';

test('главная страница загружается', async ({ page }) => {
    await page.goto('/');
    await expect(page).not.toHaveURL(/error/);
    expect(page.url()).toContain('localhost:5173');
});
