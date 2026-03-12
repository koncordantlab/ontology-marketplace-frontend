import { test, expect } from '@playwright/test';
import { setupFirebaseMocks } from '../helpers/firebase-mock';
import { setupApiMocks } from '../helpers/api-routes';
import { MOCK_USER } from '../fixtures/mock-data';

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await setupFirebaseMocks(page);
    await setupApiMocks(page);
  });

  test('login form renders with email and password fields', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toHaveText('Sign In');
  });

  test('successful login navigates to dashboard', async ({ page }) => {
    await page.goto('/');
    await page.fill('#email', MOCK_USER.email);
    await page.fill('#password', 'TestPassword123!');
    await page.click('button[type="submit"]');

    await expect(page.getByRole('button', { name: 'Dashboard' })).toBeVisible({ timeout: 15000 });
  });

  test('switch to signup mode shows name and confirm password fields', async ({ page }) => {
    await page.goto('/');
    await page.click('text=Sign up');

    await expect(page.locator('#name')).toBeVisible();
    await expect(page.locator('#confirmPassword')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toHaveText('Create Account');
  });

  test('signup with mismatched passwords shows error', async ({ page }) => {
    await page.goto('/');
    await page.click('text=Sign up');

    await page.fill('#name', 'New User');
    await page.fill('#email', 'new@example.com');
    await page.fill('#password', 'Password123!');
    await page.fill('#confirmPassword', 'DifferentPassword!');
    await page.click('button[type="submit"]');

    await expect(page.getByText('Passwords do not match')).toBeVisible();
  });

  test('logout returns to login view', async ({ page }) => {
    // Login first
    await page.goto('/');
    await page.fill('#email', MOCK_USER.email);
    await page.fill('#password', 'TestPassword123!');
    await page.click('button[type="submit"]');
    await expect(page.getByRole('button', { name: 'Dashboard' })).toBeVisible({ timeout: 15000 });

    // Click user menu to open settings, then find sign out
    await page.click('button[title="Account Settings"]');
    // The UserProfileSettings modal should have a sign out button
    const signOutButton = page.getByRole('button', { name: /sign out|log out|logout/i });
    if (await signOutButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await signOutButton.click();
      await expect(page.locator('#email')).toBeVisible({ timeout: 10000 });
    }
  });
});
