import { Page } from '@playwright/test';
import { MOCK_USER } from '../fixtures/mock-data';

/**
 * Intercept Firebase Auth REST API calls at the network level.
 * This handles signInWithPassword, signUp, accounts:lookup, and token refresh.
 *
 * NOTE: Playwright routes match in LIFO order (last registered wins).
 * The catch-all is registered FIRST so specific routes registered later take priority.
 */
export async function setupFirebaseMocks(page: Page) {
  // Catch-all for identitytoolkit calls — registered FIRST so specific routes override it
  await page.route('**/identitytoolkit.googleapis.com/**', async (route) => {
    const url = route.request().url();
    console.warn(`[firebase-mock] Unhandled Firebase Auth request: ${url}`);
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({}),
    });
  });

  // Send password reset email
  await page.route('**/identitytoolkit.googleapis.com/v1/accounts:sendOobCode**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        kind: 'identitytoolkit#GetOobConfirmationCodeResponse',
        email: MOCK_USER.email,
      }),
    });
  });

  // Update profile (setAccountInfo)
  await page.route('**/identitytoolkit.googleapis.com/v1/accounts:update**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        localId: MOCK_USER.localId,
        email: MOCK_USER.email,
        displayName: MOCK_USER.displayName,
        providerUserInfo: [],
        idToken: MOCK_USER.idToken,
        refreshToken: MOCK_USER.refreshToken,
        expiresIn: MOCK_USER.expiresIn,
      }),
    });
  });

  // Token refresh
  await page.route('**/securetoken.googleapis.com/v1/token**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        access_token: MOCK_USER.idToken,
        expires_in: MOCK_USER.expiresIn,
        token_type: 'Bearer',
        refresh_token: MOCK_USER.refreshToken,
        id_token: MOCK_USER.idToken,
        user_id: MOCK_USER.localId,
        project_id: 'mock-project',
      }),
    });
  });

  // Account lookup (used by onAuthStateChanged / getAccountInfo)
  await page.route('**/identitytoolkit.googleapis.com/v1/accounts:lookup**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        kind: 'identitytoolkit#GetAccountInfoResponse',
        users: [
          {
            localId: MOCK_USER.localId,
            email: MOCK_USER.email,
            displayName: MOCK_USER.displayName,
            emailVerified: true,
            providerUserInfo: [
              {
                providerId: 'password',
                email: MOCK_USER.email,
                displayName: MOCK_USER.displayName,
                federatedId: MOCK_USER.email,
              },
            ],
            validSince: '0',
            lastLoginAt: String(Date.now()),
            createdAt: String(Date.now() - 86400000),
          },
        ],
      }),
    });
  });

  // Sign up with email/password
  await page.route('**/identitytoolkit.googleapis.com/v1/accounts:signUp**', async (route) => {
    const request = route.request();
    const postData = request.postDataJSON?.() ?? {};
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        kind: 'identitytoolkit#SignupNewUserResponse',
        localId: MOCK_USER.localId,
        email: postData.email || MOCK_USER.email,
        displayName: postData.displayName || MOCK_USER.displayName,
        idToken: MOCK_USER.idToken,
        refreshToken: MOCK_USER.refreshToken,
        expiresIn: MOCK_USER.expiresIn,
      }),
    });
  });

  // Sign in with email/password — registered LAST for highest priority
  await page.route('**/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword**', async (route) => {
    const request = route.request();
    const postData = request.postDataJSON?.() ?? {};
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        kind: 'identitytoolkit#VerifyPasswordResponse',
        localId: MOCK_USER.localId,
        email: postData.email || MOCK_USER.email,
        displayName: MOCK_USER.displayName,
        idToken: MOCK_USER.idToken,
        registered: true,
        refreshToken: MOCK_USER.refreshToken,
        expiresIn: MOCK_USER.expiresIn,
      }),
    });
  });
}
