#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

# Install dependencies if node_modules is missing
if [ ! -d node_modules ]; then
    echo "Installing dependencies..."
    npm install
fi

# Install Playwright browsers if needed
if ! npx playwright install --dry-run chromium >/dev/null 2>&1; then
    echo "Installing Playwright browsers..."
    npx playwright install chromium
fi

# Build the app with mock environment variables for e2e testing
echo "========================================="
echo "  Building app for E2E testing"
echo "========================================="
VITE_BACKEND_BASE_URL=https://mock-api.test \
VITE_FIREBASE_API_KEY=e2e-test-key \
VITE_FIREBASE_AUTH_DOMAIN=e2e-test.firebaseapp.com \
VITE_FIREBASE_PROJECT_ID=e2e-test \
VITE_FIREBASE_STORAGE_BUCKET=e2e-test.appspot.com \
VITE_FIREBASE_MESSAGING_SENDER_ID=000000000000 \
VITE_FIREBASE_APP_ID=1:000000000000:web:e2etest \
npm run build

echo ""
echo "========================================="
echo "  Running E2E tests"
echo "========================================="
npx playwright test "$@"

echo ""
echo "========================================="
echo "  E2E tests complete"
echo "========================================="
echo "  View HTML report: npx playwright show-report"
echo "========================================="
