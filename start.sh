#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

# Create .env from .env.example if it doesn't exist
if [ ! -f .env ]; then
    echo "Creating .env from .env.example..."
    cp .env.example .env
    echo "Created .env — please update it with your actual values."
fi

# Install dependencies if node_modules is missing
if [ ! -d node_modules ]; then
    echo "Installing dependencies..."
    npm install
fi

# Start the dev server
echo "Starting frontend dev server..."
npm run dev
