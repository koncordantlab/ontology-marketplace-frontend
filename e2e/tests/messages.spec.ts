import { test, expect } from '../fixtures/auth';

test.describe('Messages / Activity Feed', () => {
  test('displays Messages page with activity items', async ({ authedPage: page }) => {
    // Click on the messages icon in the header
    await page.click('button[title="Messages"]');

    // Wait for Messages heading
    await expect(page.getByRole('heading', { name: 'Messages' })).toBeVisible({ timeout: 10000 });
  });

  test('filter tabs are visible', async ({ authedPage: page }) => {
    await page.click('button[title="Messages"]');
    await expect(page.getByRole('heading', { name: 'Messages' })).toBeVisible({ timeout: 10000 });

    // Check filter tabs (use testid to scope)
    const filterTabs = page.getByTestId('filter-tabs');
    await expect(filterTabs.getByRole('button', { name: 'All' })).toBeVisible();
    await expect(filterTabs.getByRole('button', { name: 'Comments' })).toBeVisible();
    await expect(filterTabs.getByRole('button', { name: 'Replies' })).toBeVisible();
  });

  test('search input is present', async ({ authedPage: page }) => {
    await page.click('button[title="Messages"]');
    await expect(page.getByPlaceholder('Search messages...')).toBeVisible({ timeout: 10000 });
  });

  test('unread badge appears in header', async ({ authedPage: page }) => {
    // The mock returns unread count of 2, so badge should show "2"
    const badge = page.locator('button[title="Messages"] span');
    await expect(badge).toBeVisible();
    await expect(badge).toHaveText('2');
  });
});
