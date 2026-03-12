import { test, expect } from '../fixtures/auth';
import { MOCK_ONTOLOGIES } from '../fixtures/mock-data';

test.describe('Dashboard', () => {
  test('displays ontology cards', async ({ authedPage: page }) => {
    // Verify ontology names appear
    for (const ontology of MOCK_ONTOLOGIES) {
      await expect(page.getByText(ontology.name)).toBeVisible();
    }
  });

  test('search filters ontologies by name', async ({ authedPage: page }) => {
    const searchInput = page.getByPlaceholder('Search your ontologies...');
    await searchInput.fill('Medical');

    // Medical Ontology should be visible
    await expect(page.getByText('Medical Ontology')).toBeVisible();
    // E-commerce should not be visible
    await expect(page.getByText('E-commerce Product Ontology')).not.toBeVisible();
  });

  test('Create New button is visible', async ({ authedPage: page }) => {
    await expect(page.getByRole('button', { name: /Create New/i })).toBeVisible();
  });

  test('category sidebar shows categories', async ({ authedPage: page }) => {
    await expect(page.getByText('All Ontologies')).toBeVisible();
    await expect(page.getByText('Recently Modified')).toBeVisible();
    // Use the sidebar category buttons which have specific layout
    await expect(page.getByText('Categories')).toBeVisible();
  });
});
