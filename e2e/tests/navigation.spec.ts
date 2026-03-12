import { test, expect } from '../fixtures/auth';

test.describe('Navigation', () => {
  test('header displays logo and brand name', async ({ authedPage: page }) => {
    await expect(page.getByText('OM').first()).toBeVisible();
    await expect(page.getByText('Ontology Marketplace')).toBeVisible();
  });

  test('header shows Dashboard nav link', async ({ authedPage: page }) => {
    await expect(page.getByRole('button', { name: 'Dashboard' })).toBeVisible();
  });

  test('messages icon with badge is in header', async ({ authedPage: page }) => {
    const messagesButton = page.locator('button[title="Messages"]');
    await expect(messagesButton).toBeVisible();
  });

  test('user menu button is in header', async ({ authedPage: page }) => {
    const userButton = page.locator('button[title="Account Settings"]');
    await expect(userButton).toBeVisible();
    // Shows user name in the header user button
    await expect(page.locator('button[title="Account Settings"]').getByText('Test User')).toBeVisible();
  });

  test('mobile menu toggle button exists', async ({ authedPage: page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // The hamburger menu button should be visible on mobile
    const menuButton = page.locator('header button').first();
    await expect(menuButton).toBeVisible();
  });
});
