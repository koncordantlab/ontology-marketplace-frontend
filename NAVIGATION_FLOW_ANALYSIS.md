# Navigation Flow Analysis

## Current Navigation Process - Step by Step

### Click Handler (DashboardView.tsx lines 342-345)

```javascript
onClick={() => {
  const absoluteUrl = `${window.location.origin}${window.location.pathname}#ontology-details/${ontologyUuid}`;
  const target = `ontology-${ontologyUuid}`;
  window.open(absoluteUrl, target);
}}
```

**What happens:**
1. Constructs absolute URL: `http://localhost:5173/#ontology-details/uuid`
2. Creates unique target name: `ontology-uuid` (one per UUID)
3. Calls `window.open(url, targetName)`

### window.open() Behavior

**Critical browser behavior:**
- `window.open(url, targetName)` works as follows:
  - If a window with `targetName` already exists → **reuses that window** (navigates it)
  - If `targetName` doesn't exist → opens a new window
  - If `targetName` is empty or `_blank` → always opens new window

**Scenario 1: First Click (Card A, UUID = uuid-a)**
```
target = "ontology-uuid-a"
window.open(url, "ontology-uuid-a")
→ Window doesn't exist → Opens NEW window with hash #ontology-details/uuid-a
```

**Scenario 2: Second Click (Card B, UUID = uuid-b)**  
```
target = "ontology-uuid-b"  // Different UUID = different target
window.open(url, "ontology-uuid-b")
→ Window doesn't exist → Opens NEW window with hash #ontology-details/uuid-b
```

**Scenario 3: Click Same Card Again (Card A, UUID = uuid-a)**
```
target = "ontology-uuid-a"  // Same target as first click
window.open(url, "ontology-uuid-a")
→ Window EXISTS → REUSES existing window, navigates to new URL
→ Hash changes from #ontology-details/uuid-a to #ontology-details/uuid-a (same)
→ hashchange event fires → Routing processes
```

### New Window Initialization (App.tsx)

**First useEffect (lines 32-75):**
1. Runs on mount
2. Captures `window.location.hash` → stores in `pendingHash`
3. Sets up auth listener (async)
4. Checks if user exists:
   - If user exists AND no hash → sets `currentView = 'dashboard'`
   - If user exists AND hash present → leaves `currentView` as-is (defaults to 'dashboard' initially)
5. Sets `isLoading = false` synchronously

**Timeline Issue:**
```
T0: Window opens with #ontology-details/uuid-a
T1: First useEffect runs
T2: hash captured → pendingHash = '#ontology-details/uuid-a'
T3: User check → currentView stays at initial state ('dashboard')
T4: isLoading = false (synchronous)
```

**Second useEffect (lines 77-142):**
1. Depends on `[isLoading, pendingHash]`
2. Only runs when `isLoading === false`
3. Processes hash:
   - Parses: `#ontology-details/uuid-a` → splits by '/'
   - Sets: `selectedOntologyId = 'uuid-a'`
   - Sets: `currentView = 'ontology-details'`
4. Clears `pendingHash`

### The Problem: Window Reuse Behavior

**When clicking different cards:**

**Click 1 (uuid-a):**
- `target = "ontology-uuid-a"`
- Opens NEW window → Hash = `#ontology-details/uuid-a`
- App initializes → Processes hash → Shows detail view ✓

**Click 2 (uuid-b):**
- `target = "ontology-uuid-b"`  // Different target
- Should open NEW window → Hash = `#ontology-details/uuid-b`
- But user reports: "refreshes dashboard"

**Possible Causes:**

1. **Target Name Collision?**
   - If `uuid-a === uuid-b` (same ontology clicked twice)
   - Target name would be the same
   - Window would be reused
   - But user says "different cards"...

2. **Hash Not Set Before Window Reuse?**
   - When `window.open()` reuses a window, it navigates immediately
   - But if the hash parsing hasn't completed, dashboard might render first
   - Then hash processes, but maybe too late?

3. **hashchange Event Timing?**
   - When reusing a window, `hashchange` event fires
   - But `window.location.hash` might not be set correctly?
   - Or the routing effect might not run?

4. **Current View State Persists?**
   - If a window is reused from dashboard state
   - The `currentView` state might be 'dashboard'
   - Hash change might not override it?

### The Real Issue: Hash Processing in Reused Windows

When `window.open()` reuses an existing window:

**Existing window state:**
- `currentView = 'ontology-details'` (from previous load)
- `selectedOntologyId = 'uuid-a'`
- Hash = `#ontology-details/uuid-a`

**window.open() navigates to:**
- New URL: `#ontology-details/uuid-b`
- `hashchange` event fires
- Routing effect should process new hash

**BUT:**
- The hash routing effect (line 78) depends on `[isLoading, pendingHash]`
- `isLoading` is already `false` (window was already loaded)
- `pendingHash` is already `null` (was cleared after first load)
- Effect only runs when dependencies change
- `hashchange` listener should catch it...

**Let me check the hashchange handler...**

Looking at line 130-133:
```javascript
const handleHashChange = () => {
  const hash = window.location.hash;
  processHash(hash);
};
```

This should fire when hash changes. But wait...

**Issue:** The hashchange handler is set up in the effect, but:
- The effect runs when `isLoading` changes or `pendingHash` changes
- Once `isLoading = false` and `pendingHash = null`, the effect has already run
- The hashchange listener is set up
- BUT: The effect's dependency array includes `pendingHash`
- When hash changes, `pendingHash` doesn't change (it's null)
- So the effect doesn't re-run
- Only the `hashchange` listener should fire

**This should work... unless...**

### The Actual Problem

Looking at the code flow more carefully:

**First load:**
1. Window opens with hash `#ontology-details/uuid-a`
2. First useEffect: Sets `pendingHash = '#ontology-details/uuid-a'`
3. Sets `isLoading = false`
4. Second useEffect: Runs (because `pendingHash` changed)
5. Processes hash → Sets view to 'ontology-details' ✓

**Second click (different card, same window reused):**
1. `window.open()` navigates existing window to `#ontology-details/uuid-b`
2. `hashchange` event fires
3. `handleHashChange()` runs → calls `processHash('#ontology-details/uuid-b')`
4. Should set `selectedOntologyId = 'uuid-b'` and `currentView = 'ontology-details'`

**BUT:** The first useEffect only runs once on mount. If the window is reused, it doesn't re-run.
The second useEffect only processes `pendingHash || window.location.hash` on mount.

Wait, let me re-read the hashchange handler...

Actually, the hashchange handler should work. But maybe the issue is:

**When window is reused and navigated:**
- The React app is already mounted
- `hashchange` fires
- Handler calls `processHash(hash)`
- But React might have already rendered based on previous state

**Or:** The window being reused is actually the **dashboard window** itself, not a detail view window.

If the user clicks a card, opens detail view, then clicks another card from the **original dashboard window**, it would:
- Navigate the dashboard window (not open a new one)
- But dashboard doesn't have hash routing set up the same way?

No wait, all windows are the same App instance, so they all have routing.

**I think the issue is:** When you click from the dashboard window again, if you're clicking in the same window that has `target = 'dashboard'` or something, it reuses the dashboard window instead of opening a new one.

Or: The `target` name calculation might be wrong? Let me check...

```javascript
const target = `ontology-${ontologyUuid}`;
```

This should be unique per UUID. But what if `ontologyUuid` is empty or undefined?

```javascript
const ontologyUuid = (ontology as any).uuid || ontology.id || '';
```

If both are missing, `ontologyUuid = ''`, so `target = 'ontology-'` for all cards!
That would cause ALL clicks to reuse the same window!

**This is likely the bug!**

