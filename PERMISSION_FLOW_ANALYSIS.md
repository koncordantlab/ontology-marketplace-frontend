# Permission Checking Flow Analysis

## Current Process

### Step 1: OntologyDetailsView Loads (OntologyDetailsView.tsx lines 86-112)

```javascript
useEffect(() => {
  if (!ontologyId) {
    setCanEdit(false);
    return;
  }
  
  const ontologyUuid = (ontology && (ontology as any).uuid) || ontologyId;
  
  // Step 1a: Check from cache (immediate, no network call)
  const canEditResult = userService.canEdit(ontologyUuid);
  setCanEdit(canEditResult);  // ⚠️ Might be false if cache is empty/stale
  const canDeleteResult = userService.canDelete(ontologyUuid);
  setCanDelete(canDeleteResult);
  
  // Step 1b: Refresh cache if stale (async, background)
  if (userService.isStale()) {
    userService.refresh().then(() => {
      // Step 1c: Re-check after refresh (several seconds later)
      const refreshedEdit = userService.canEdit(ontologyUuid);
      setCanEdit(refreshedEdit);  // ✅ Now correct permissions
      const refreshedDelete = userService.canDelete(ontologyUuid);
      setCanDelete(refreshedDelete);
    });
  }
}, [ontologyId, ontology]);
```

### Step 2: UserService Cache Check (userService.ts)

**Initial State:**
- `userAccount = null` (empty cache)
- `editableIds = new Set()` (empty)
- `lastFetched = 0` (cache is stale)

**isStale() check:**
```javascript
isStale(): boolean {
  return Date.now() - this.lastFetched > this.CACHE_TTL_MS; // 5 minutes
}
```
- If `lastFetched = 0`, then cache is stale (never fetched)
- Triggers `refresh()` call

**refresh() process:**
```javascript
async refresh(): Promise<UserAccount | null> {
  // Makes GET request to /get_user endpoint
  // Updates: editableIds, deletableIds, lastFetched
  // Returns cached permissions
}
```

### Step 3: App.tsx User Account Loading (App.tsx)

```javascript
// On login or initial load
userService.refresh().catch((error) => {
  console.error('Failed to fetch user account on initial load:', error);
});
```

**Problem**: This refresh happens in App.tsx, but:
- It's async (takes time)
- OntologyDetailsView might load before refresh completes
- If refresh hasn't completed, cache is still empty

## The Delay Problem

**Timeline:**

1. **T0: User clicks ontology card**
   - Opens new window with `#ontology-details/uuid`
   - App.tsx starts loading user account (async)

2. **T1: OntologyDetailsView mounts**
   - Ontology fetched successfully ✓
   - Permission check runs immediately
   - Cache is empty → `canEdit = false` ❌
   - UI renders as **READ-ONLY**

3. **T2: Cache refresh starts (if stale)**
   - `userService.isStale()` returns true
   - `userService.refresh()` called (network request)
   - Takes 1-3 seconds depending on network

4. **T3: Cache refresh completes**
   - Permissions loaded into cache
   - `canEdit(ontologyUuid)` now returns true ✓
   - UI updates to show **EDIT OPTIONS**

**Result**: User sees read-only view for 1-3 seconds before edit options appear.

## Root Causes

1. **Cache warming happens too late**
   - Permissions fetched in App.tsx but async
   - OntologyDetailsView might mount before cache is ready

2. **No loading state for permissions**
   - UI immediately shows read-only based on empty cache
   - Should show "checking permissions" or optimistic UI

3. **Stale check triggers after initial render**
   - Should check if cache is empty/stale and refresh BEFORE setting permissions
   - Currently sets permissions from empty cache first

4. **No optimistic permission checking**
   - Could check if user owns ontology based on `ownerId`
   - But current design relies entirely on backend permissions

## Solution Approaches

### Option 1: Pre-fetch Permissions (Recommended)
**Strategy**: Ensure permissions are loaded before OntologyDetailsView renders

**Implementation:**
- Check if cache is empty/stale BEFORE setting permissions
- If empty/stale, wait for refresh to complete before rendering edit UI
- Show loading indicator for permissions

**Pros:**
- Immediate correct permissions
- No UI flickering

**Cons:**
- Slight delay before edit UI appears (but consistent)
- Need loading state

### Option 2: Optimistic Permissions
**Strategy**: Show edit options immediately if user matches ownerId

**Implementation:**
- Check `ontology.ownerId === currentUser.id` immediately
- Show edit options optimistically
- Background refresh confirms/corrects

**Pros:**
- Instant edit UI for owners
- Better UX for common case

**Cons:**
- Might show edit to non-owners briefly (then hide)
- Complex permission logic

### Option 3: Parallel Loading
**Strategy**: Fetch permissions at same time as ontology data

**Implementation:**
- Start permission fetch immediately when ontologyId is available
- Don't wait for ontology to load
- Both complete around same time

**Pros:**
- Permissions ready when ontology loads
- Better perceived performance

**Cons:**
- Still requires loading state if permissions aren't ready

### Option 4: Cache Warming on Navigation
**Strategy**: Pre-fetch permissions when user navigates to detail view

**Implementation:**
- When navigating to `#ontology-details/uuid`, start permission fetch
- By time view loads, permissions might be ready

**Pros:**
- Permissions might be ready by render time

**Cons:**
- Not guaranteed to be ready
- Still need fallback

## Recommended Solution: Combined Approach

1. **Check cache state BEFORE setting permissions**
   - If cache is empty or stale, refresh FIRST
   - Wait for refresh before setting initial permissions

2. **Show loading state for permissions**
   - Don't show read-only immediately
   - Show "Checking permissions..." or disable edit UI until ready

3. **Pre-warm cache in App.tsx**
   - Ensure refresh completes on login
   - Cache should be warm before navigation

4. **Optimistic check (optional)**
   - If cache is warm and ontology has ownerId, check ownership
   - But still verify with backend permissions

