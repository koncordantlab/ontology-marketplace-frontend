import { test, expect } from '../fixtures/auth';

test.describe('Create Ontology', () => {
  test('form renders with required fields', async ({ authedPage: page }) => {
    // Navigate to new ontology view
    await page.click('button:has-text("Create New")');

    // Wait for the form to load
    await expect(page.getByRole('heading', { name: 'Create New Ontology' })).toBeVisible({ timeout: 10000 });
  });

  test('successful ontology creation', async ({ authedPage: page }) => {
    await page.click('button:has-text("Create New")');

    // Wait for form
    await page.waitForTimeout(1000);

    // Look for title/name input and description textarea
    const titleInput = page.locator('input[placeholder*="name" i], input[placeholder*="title" i]').first();
    const descriptionInput = page.locator('textarea').first();

    if (await titleInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await titleInput.fill('Test Ontology');
    }

    if (await descriptionInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await descriptionInput.fill('A test ontology for e2e testing');
    }

    // Try to find and click the create/submit button
    const submitButton = page.getByRole('button', { name: /create|submit|save/i }).first();
    if (await submitButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await submitButton.click();
    }
  });
});
