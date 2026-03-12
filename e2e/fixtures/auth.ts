import { test as base, Page } from '@playwright/test';
import { setupFirebaseMocks } from '../helpers/firebase-mock';
import { setupApiMocks } from '../helpers/api-routes';
import { MOCK_USER } from './mock-data';

type AuthFixtures = {
  authedPage: Page;
};

/**
 * Custom fixture that provides a page pre-authenticated via the login form.
 * Sets up all network mocks, navigates to the app, and signs in.
 */
export const test = base.extend<AuthFixtures>({
  authedPage: async ({ page }, use) => {
    // Set up all network-level mocks
    await setupFirebaseMocks(page);
    await setupApiMocks(page);

    // Navigate to the app
    await page.goto('/');

    // Wait for login form to appear
    await page.waitForSelector('#email', { timeout: 15000 });

    // Fill in login form
    await page.fill('#email', MOCK_USER.email);
    await page.fill('#password', 'TestPassword123!');

    // Click sign in button
    await page.click('button[type="submit"]');

    // Wait for dashboard to load (indicates successful login)
    await page.waitForSelector('button:has-text("Dashboard")', { timeout: 15000 });

    await use(page);
  },
});

export { expect } from '@playwright/test';
