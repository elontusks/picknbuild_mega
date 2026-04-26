# Search Page Functional Tasks — Prompts for Fresh Sessions

Each prompt is self-contained. A fresh Claude Code session can pick any prompt and complete it independently. All tasks use the same repo and can be merged in any order (they don't block each other).

---

## TASK 1: Persist Picked Cars to Garage (Backend Save)

**Owner:** Anyone  
**Estimated:** 20 min  
**Files Changed:** 3–4

### Context
The search page displays four columns of cars (Dealer, Auction, picknbuild, Individual). When a user clicks "Pick" on a car, it currently adds the car to local React state (`pickedCars` array). This state is lost on page reload.

We need to persist picks to the database via the existing `/api/garage` endpoint, which already accepts `POST { listingId, decision: "pick" }`.

### Problem
1. Car objects flowing through columns don't carry the `listing.id` field (they're shaped as `Car` demo type)
2. `handlePickCar()` in `search-page-client.tsx` has no API call
3. No feedback (toast) to user on success/failure

### Solution
1. **Update Car type** (`src/lib/search-demo/types.ts`):
   - Add optional `listingId?: string` field to `Car` interface

2. **Update listingToCar()** (`src/lib/search-demo/listing-to-car.ts`):
   - When converting `ListingObject` → `Car`, include `car.listingId = listing.id`

3. **Update handlePickCar()** (`src/app/search/search-page-client.tsx`):
   - Import a toast hook or create simple toast state
   - Wrap the existing `setPickedCars()` call with an async function:
     ```typescript
     const handlePickCar = useCallback(async (car: Car) => {
       if (!car.listingId) {
         showToast("error", "Cannot pick this car—no listing ID");
         return;
       }
       
       const res = await fetch("/api/garage", {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({ listingId: car.listingId, decision: "pick" }),
       });
       
       if (!res.ok) {
         showToast("error", "Failed to add to garage");
         return;
       }
       
       const pickedCar: PickedCar = { ...car, pickedAt: new Date() };
       setPickedCars((prev) => [...prev, pickedCar]);
       showToast("success", "Added to garage!");
     }, []);
     ```

4. **Toast notification** (optional but recommended):
   - Use a simple hook: `const [toast, showToast] = useState<{ message: string; type: "success" | "error" } | null>(null)`
   - Render a small toast div at bottom of screen

### Verification
1. Dev server running (`PORT=3000 npm run dev`)
2. Navigate to `/search`
3. Click "Pick" on any car
4. Should see success toast
5. Reload page — car should still be in garage sidebar (because `/api/garage` GET now returns it)
6. Run `npx tsc --noEmit` — no type errors

---

## TASK 2: Load Picked Cars from Garage on Page Mount

**Owner:** Anyone  
**Estimated:** 15 min  
**Files Changed:** 1

### Context
Right now, when you pick a car and then refresh the page, the garage sidebar is empty because `pickedCars` state is not persisted to the server.

The `/api/garage` GET endpoint already exists and returns the user's saved garage items. We need to load them on component mount.

### Solution
1. **Update SearchPageClient** (`src/app/search/search-page-client.tsx`):
   - Add `useEffect` hook that runs once on mount:
     ```typescript
     useEffect(() => {
       const loadGarage = async () => {
         const res = await fetch("/api/garage");
         if (!res.ok) return;
         const { items } = await res.json();
         // items is array of GarageItem { id, userId, listing, decision, createdAt, updatedAt }
         // Convert to PickedCar and set state
         const picked = items
           .filter(item => item.decision === "pick")
           .map(item => ({
             ...listingToCar(item.listing),
             pickedAt: new Date(item.createdAt),
           }));
         setPickedCars(picked);
       };
       loadGarage();
     }, []);
     ```

2. **Import type** if needed:
   - Check `@/services/team-08-garage` for GarageItem shape

### Verification
1. Pick a car and refresh page
2. Car should still appear in garage sidebar
3. Garage counts and grouping should work correctly

---

## TASK 3: Match Mode Filtering — Affordability Filter

**Owner:** Anyone  
**Estimated:** 30 min  
**Files Changed:** 2

### Context
When a user enables "Match Mode" in the MatchModeBar, the four columns should filter to show only cars the user can actually afford based on their credit score, available cash, and the path's requirements.

Currently, `userProfile.matchModeEnabled` is set in state, but columns ignore it for filtering—they show all cars regardless.

### Problem
1. No filtering logic in columns based on affordability
2. No affordability calculation wired to column rendering
3. Users see unaffordable cars even with Match Mode on

### Solution
1. **Affordability calculation** (likely in Team 11's pricing logic):
   - Identify Team 11's exported functions: `calculateDealerAffordability()`, `calculateAuctionAffordability()`, etc.
   - These should accept `(userProfile, carPrice)` and return `{ canAfford: boolean; shortBy?: number; ... }`
   - Check `src/lib/search-demo/matchModeUtils.ts` for these functions

2. **Update SearchPageInner** to filter cars before passing to columns:
   ```typescript
   const dealerCars = useMemo(() => {
     let filtered = initialDealerCars.filter(filterMatch);
     
     if (userProfile.matchModeEnabled) {
       filtered = filtered.filter(car => {
         const affordability = calculateDealerAffordability(
           userProfile,
           car.acv || 20000
         );
         return affordability.canAfford;
       });
     }
     
     return filtered;
   }, [initialDealerCars, filterMatch, userProfile.matchModeEnabled, userProfile]);
   ```

3. **Apply same logic to other paths:**
   - `auctionCars` → `calculateAuctionAffordability()`
   - `individualCars` → `calculateIndividualAffordability()`
   - `picknbuildCars` → `calculatePicknbuildAffordability()`

4. **Update column UIs** to show filter badge:
   - Add line near column title: `{userProfile.matchModeEnabled && filtered.length < initial.length && (
       <span style={{ fontSize: '11px', color: 'var(--muted-foreground)' }}>
         Showing {filtered.length} affordable
       </span>
     )}`

### Verification
1. Set credit score to 550 (Poor), available cash to $5,000
2. Enable Match Mode
3. Columns should show 0–2 cars max (most are unaffordable)
4. Disable Match Mode — full list returns
5. Set credit to 760 (Excellent), cash to $30,000, enable Match Mode
6. Columns should show most/all cars

---

## TASK 4: Persist User Intake State to User Record

**Owner:** Anyone  
**Estimated:** 25 min  
**Files Changed:** 2

### Context
The MatchModeBar at the top of the search page collects user input:
- Location (ZIP)
- Available cash
- Credit score
- Title preference (clean/rebuilt)
- Match Mode toggle

Currently, all this is local React state. When the user reloads, it resets to defaults. We need to persist changes back to the `User` record in Supabase so it survives reloads.

### Solution
1. **Update MatchModeBar** (`src/components/clarity/MatchModeBar.tsx`):
   - Add async handler for profile changes:
     ```typescript
     const handleSaveProfile = async (updated: UserProfile) => {
       try {
         const res = await fetch("/api/users/profile", {
           method: "PATCH",
           headers: { "Content-Type": "application/json" },
           body: JSON.stringify({
             availableCash: updated.availableCash,
             creditScore: updated.creditScore,
             titleType: updated.titleType,
             zip: userZip, // or pass as prop if separate
           }),
         });
         if (!res.ok) console.error("Failed to save profile");
       } catch (e) {
         console.error("Profile save error", e);
       }
     };
     ```
   - Call `handleSaveProfile()` whenever user changes a field (debounce with 1sec timeout)

2. **Create/update API endpoint** (`src/app/api/users/profile/route.ts`):
   - PATCH handler that updates User record:
     ```typescript
     export const PATCH = requireCap(C.users.view_own)(async (req, _ctx, principal) => {
       const body = await req.json();
       const updated = await updateUser(principal.id, {
         availableCash: body.availableCash,
         creditScore: body.creditScore,
         titleType: body.titleType,
         zip: body.zip,
       });
       return NextResponse.json(updated);
     });
     ```
   - Use Team 1's `updateUser()` service function

3. **Load on page init** in `search-page-client.tsx`:
   - Fetch `/api/users/profile` and initialize `userProfile` state from it instead of hardcoded defaults
   - Only set defaults if fetch fails

### Verification
1. Change credit score to 670, click away or wait 1s
2. Refresh page — credit should be 670
3. Change available cash to $15,000 → reload → should persist
4. Check Supabase DB directly to confirm columns updated

---

## TASK 5: Configurator Entry Point — Start Building Flow

**Owner:** Anyone  
**Estimated:** 25 min  
**Files Changed:** 3–4

### Context
When a user picks a car from the "picknbuild" column, they should have the option to "Start Building" a package rather than just adding to Garage. This should navigate to `/configurator?carId=X` with the selected car pre-populated.

Currently, the PicknBuild column only shows the generic "Pick" button. We need:
1. A "Start Building" button that navigates to configurator
2. The configurator page to accept `carId` query param and load the car

### Solution
1. **Update PickNBuildColumn** (`src/components/clarity/columns/PickNBuildColumn.tsx`):
   - Add a second button next to "Pick":
     ```typescript
     <button onClick={() => {
       if (!currentCar.listingId) return;
       router.push(`/configurator?carId=${currentCar.listingId}`);
     }}>
       Start Building
     </button>
     ```
   - Need `import { useRouter } from "next/navigation"`

2. **Update configurator page** (`src/app/configurator/page.tsx`):
   - Accept `carId` query param
   - Load the car from `/api/listings/{carId}` on mount
   - Pre-populate the configurator form with car details (make, model, year, mileage, price)

3. **Optional:** Add confirmation modal before navigating:
   - "Ready to build? You'll select packages and financing next"
   - Button to confirm or cancel

### Verification
1. Navigate to `/search`
2. Open picknbuild column
3. Click a car's "Start Building" button
4. Should navigate to `/configurator?carId=...`
5. Configurator page should show the car details loaded
6. Form should be pre-filled (or at least car data available in state)

---

## Summary Table

| Task | Complexity | Dependencies | Can Run Solo? |
|------|-----------|--------------|--------------|
| 1. Persist Picks | Medium | Task 2 | Yes |
| 2. Load Garage | Low | Task 1 | Yes |
| 3. Match Filtering | Medium | Team 11 utils | Yes |
| 4. Persist Intake | Medium | Team 1 User service | Yes |
| 5. Configurator Flow | Medium | None | Yes |

**Recommended Order:**
1. Task 2 (load garage) + Task 1 (persist picks) together — they're interdependent
2. Task 3 (filtering) — uses Team 11 functions that should already exist
3. Task 4 (intake state) — persistence of user prefs
4. Task 5 (configurator) — bonus flow for power users

**All can be done in parallel if separate people pick them up.** No blocking dependencies except Task 1 ↔ Task 2.

---

## Testing All 5 Together

```bash
# After all tasks merged:
PORT=3000 npm run dev

# Test checklist:
- [ ] Load /search — user intake values from last session load
- [ ] Set cash to $8,000, credit to 620, enable Match Mode
- [ ] See filtered columns (fewer cars)
- [ ] Click "Pick" on Dealer car → toast appears
- [ ] Garage sidebar updates with car
- [ ] Reload page → car still in garage
- [ ] Click "Start Building" on picknbuild car → navigate to configurator
- [ ] Configurator shows car details pre-filled
- [ ] Run: npx tsc --noEmit (no errors)
```
