import { Page } from '@playwright/test';
import {
  MOCK_ONTOLOGIES,
  MOCK_TAGS,
  MOCK_ACTIVITY_ITEMS,
  MOCK_COMMENTS,
  MOCK_USER_ACCOUNT,
} from '../fixtures/mock-data';

const API_BASE = 'https://mock-api.test';

/**
 * Intercept all backend API calls with mock responses.
 */
export async function setupApiMocks(page: Page) {
  // Search / list ontologies
  await page.route(`${API_BASE}/search_ontologies*`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_ONTOLOGIES),
    });
  });

  // Get ontology by ID
  await page.route(`${API_BASE}/ontologies/*`, async (route) => {
    const url = route.request().url();
    // Skip comment sub-routes
    if (url.includes('/comments')) return route.fallback();

    const id = url.split('/ontologies/')[1]?.split('?')[0];
    const ontology = MOCK_ONTOLOGIES.find((o) => o.uuid === id || o.id === id);
    await route.fulfill({
      status: ontology ? 200 : 404,
      contentType: 'application/json',
      body: JSON.stringify(ontology || { detail: 'Not found' }),
    });
  });

  // Create ontology
  await page.route(`${API_BASE}/add_ontologies*`, async (route) => {
    const body = route.request().postDataJSON?.();
    const payload = Array.isArray(body) ? body[0] : body;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 'new-ont-id',
        uuid: 'new-ont-uuid',
        name: payload?.name || 'New Ontology',
        description: payload?.description || '',
        properties: payload?.properties || { is_public: false },
        tags: payload?.tags || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }),
    });
  });

  // Update ontology
  await page.route(`${API_BASE}/update_ontology/**`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true }),
    });
  });

  // Delete ontology
  await page.route(`${API_BASE}/delete_ontologies*`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true }),
    });
  });

  // Tags
  await page.route(`${API_BASE}/get_tags*`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_TAGS),
    });
  });

  // User account
  await page.route(`${API_BASE}/get_user*`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_USER_ACCOUNT),
    });
  });

  await page.route(`${API_BASE}/update_user*`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true }),
    });
  });

  // Comments
  await page.route(`${API_BASE}/ontologies/*/comments*`, async (route) => {
    const method = route.request().method();
    if (method === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { comments: MOCK_COMMENTS, total: MOCK_COMMENTS.length },
        }),
      });
    } else if (method === 'POST') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          uuid: 'new-comment-uuid',
          content: 'New comment',
          created_at: new Date().toISOString(),
          author_email: 'test@example.com',
          author_name: 'Test User',
        }),
      });
    } else {
      await route.fallback();
    }
  });

  // Comment operations (edit, delete, reactions, flag, replies)
  await page.route(`${API_BASE}/comments/**`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true }),
    });
  });

  // Activity feed
  await page.route(`${API_BASE}/users/me/activity?*`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: { items: MOCK_ACTIVITY_ITEMS, total: MOCK_ACTIVITY_ITEMS.length },
      }),
    });
  });

  await page.route(`${API_BASE}/users/me/activity`, async (route) => {
    // Exact match (no query params)
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { items: MOCK_ACTIVITY_ITEMS, total: MOCK_ACTIVITY_ITEMS.length },
        }),
      });
    } else {
      await route.fallback();
    }
  });

  // Unread count
  await page.route(`${API_BASE}/users/me/activity/unread-count*`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: { count: 2 } }),
    });
  });

  // Mark activity as read
  await page.route(`${API_BASE}/users/me/activity/*/read*`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true }),
    });
  });

  // Mark all activity as read
  await page.route(`${API_BASE}/users/me/activity/read-all*`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true }),
    });
  });

  // Messages
  await page.route(`${API_BASE}/messages*`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    });
  });

  // Auth verify token
  await page.route(`${API_BASE}/auth/verify-token*`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ valid: true }),
    });
  });
}
