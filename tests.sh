#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

COVERAGE_DIR=".coverage_history"
COVERAGE_PREV="$COVERAGE_DIR/coverage-prev.json"

# Install dependencies if node_modules is missing
if [ ! -d node_modules ]; then
    echo "Installing dependencies..."
    npm install
fi

# Save previous coverage if it exists
mkdir -p "$COVERAGE_DIR"
if [ -f coverage/coverage-final.json ]; then
    cp coverage/coverage-final.json "$COVERAGE_PREV"
fi

# Run all unit tests with coverage
echo "========================================="
echo "  Running frontend tests with coverage"
echo "========================================="
npx vitest run --coverage "$@"

# Show coverage delta if previous run exists
if [ -f "$COVERAGE_PREV" ] && [ -f coverage/coverage-final.json ]; then
    echo ""
    echo "========================================="
    echo "  Coverage changes since last run"
    echo "========================================="
    node -e "
const fs = require('fs');
const prev = JSON.parse(fs.readFileSync('$COVERAGE_PREV', 'utf8'));
const curr = JSON.parse(fs.readFileSync('coverage/coverage-final.json', 'utf8'));

function filePct(data) {
  const s = data.s || {};
  const total = Object.keys(s).length;
  if (total === 0) return 100;
  const covered = Object.values(s).filter(v => v > 0).length;
  return (covered / total) * 100;
}

function totalPct(cov) {
  const files = Object.keys(cov);
  if (files.length === 0) return 0;
  let totalS = 0, coveredS = 0;
  for (const f of files) {
    const s = cov[f].s || {};
    totalS += Object.keys(s).length;
    coveredS += Object.values(s).filter(v => v > 0).length;
  }
  return totalS > 0 ? (coveredS / totalS) * 100 : 0;
}

const prevPct = totalPct(prev);
const currPct = totalPct(curr);
const delta = currPct - prevPct;

const arrow = delta > 0 ? '↑' : (delta < 0 ? '↓' : '→');
const color = delta > 0 ? '\x1b[32m' : (delta < 0 ? '\x1b[31m' : '\x1b[33m');
const reset = '\x1b[0m';

console.log('  Overall: ' + prevPct.toFixed(1) + '% → ' + currPct.toFixed(1) + '%  ' + color + arrow + ' ' + (delta >= 0 ? '+' : '') + delta.toFixed(1) + '%' + reset);
console.log();

// Per-file deltas
const allFiles = [...new Set([...Object.keys(prev), ...Object.keys(curr)])].sort();
const changes = [];
for (const f of allFiles) {
  const shortName = f.replace(process.cwd() + '/', '');
  const p = prev[f] ? filePct(prev[f]) : 0;
  const c = curr[f] ? filePct(curr[f]) : 0;
  const d = c - p;
  if (Math.abs(d) > 0.01 || !prev[f]) {
    changes.push({ name: shortName, prev: p, curr: c, delta: d, isNew: !prev[f] });
  }
}

if (changes.length > 0) {
  for (const ch of changes) {
    if (ch.isNew) {
      console.log('  \x1b[36mNEW\x1b[0m  ' + ch.curr.toFixed(1) + '%  ' + ch.name);
    } else {
      const a = ch.delta > 0 ? '↑' : '↓';
      const c = ch.delta > 0 ? '\x1b[32m' : '\x1b[31m';
      console.log('  ' + c + (ch.delta >= 0 ? '+' : '') + ch.delta.toFixed(1) + '%\x1b[0m  ' + ch.prev.toFixed(1) + '% → ' + ch.curr.toFixed(1) + '%  ' + ch.name);
    }
  }
} else {
  console.log('  No per-file changes.');
}
console.log();
"
else
    echo ""
    echo "(First run — no previous coverage to compare against)"
    echo "(Run tests again to see coverage delta)"
fi
