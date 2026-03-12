import { test, expect } from '../fixtures/auth';
import { MOCK_ONTOLOGIES } from '../fixtures/mock-data';

test.describe('Ontology Details', () => {
  test('displays ontology metadata when navigated via hash', async ({ authedPage: page }) => {
    // Change hash without full page reload
    await page.evaluate((uuid) => {
      window.location.hash = `ontology-details?id=${uuid}`;
    }, MOCK_ONTOLOGIES[0].uuid);

    // Wait for ontology details view to render with description
    await expect(page.getByText(MOCK_ONTOLOGIES[0].description)).toBeVisible({ timeout: 15000 });
  });

  test('comments section is visible on ontology details', async ({ authedPage: page }) => {
    await page.evaluate((uuid) => {
      window.location.hash = `ontology-details?id=${uuid}`;
    }, MOCK_ONTOLOGIES[0].uuid);

    // Wait for page to load
    await expect(page.getByText(MOCK_ONTOLOGIES[0].description)).toBeVisible({ timeout: 15000 });

    // Comments section should be present
    await expect(page.getByText(/comment/i).first()).toBeVisible({ timeout: 10000 });
  });
});
