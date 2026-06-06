# Menu UX Developer Agent

## Role
Specialist frontend developer focused on the Keshav Kitchen daily menu planning UX. Your job is to redesign the person-count entry and auto-calculation flow to be frictionless and intuitive.

## Context
This is a temple kitchen management app. Users plan daily meals (Breakfast/Lunch/Dinner/Snack) for different person types (e.g., Adults, Seniors, Children). They enter how many of each person type are eating, then the system auto-calculates ingredient quantities.

**Current Problem:** Person counts are entered in too many places:
1. Each of the 4 meal cards has a "Users" icon that opens a separate dialog for counts
2. The AddMealDialog ALSO has a "Consumption planner" section with editable count inputs
3. Users end up entering the same numbers up to 8 times per day

**Solution:** Create a unified PersonCountsPanel that replaces all per-card count dialogs.

## Project Conventions
- Framework: Next.js 15 App Router, TypeScript, Tailwind CSS 4
- State: React useState/useCallback/useMemo/useEffect
- Components: Radix UI primitives in `components/ui/` — use Tabs, Switch, Input, Button, Card, Tooltip from there
- i18n: `useTranslations` hook from `@/hooks/use-translations`, keys in `locales/en/common.json` + `locales/gu/common.json`
- Icons: lucide-react
- Path alias: `@/` maps to repo root
- cn() utility from `@/lib/utils`
- No new npm packages
- TypeScript strict — no `any` unless interfacing with existing `any` typed code
- No comments unless WHY is non-obvious

## Type Reference
```ts
// From @/types/premises.ts:
interface PremisePersonType {
  id: string;
  name: string;
  description?: string | null;
  sequenceNumber: number;
  premiseId: string;
}

// From @/types/menus.ts (also exported from @/types/index.ts):
type MealType = "BREAKFAST" | "LUNCH" | "DINNER" | "SNACK";
enum MealTypeEnum { BREAKFAST="BREAKFAST", LUNCH="LUNCH", DINNER="DINNER", SNACK="SNACK" }
```

---

## Task 1: Create PersonCountsPanel

**File:** `components/menu/person-counts-panel.tsx`

```tsx
interface PersonCountsPanelProps {
  personTypes: PremisePersonType[]
  personCountsByMealType: Record<string, Record<string, number>>
  onPersonCountChange: (mealType: string, personTypeId: string, count: number) => void
  onAddPersonType?: () => void
}
```

**Visual design:**
```
┌─── People Counts ────────────────────────────── [Same for all] [switch] ─┐
│  [Breakfast] [Lunch] [Dinner] [Snack]                        Total: 123  │
│                                                                            │
│  Adults  [___50___]   Seniors [___20___]   Children [___10___]            │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

**Behavior:**
- 4 tabs: Breakfast, Lunch, Dinner, Snack (use `components/ui/tabs.tsx`)
- When "Same for all meals" switch is ON:
  - All 4 meal types share the same counts
  - Changing one tab updates all 4
  - The tab switcher still shows (for reference), but counts are visually the same
  - Implement by calling `onPersonCountChange` for ALL 4 meal types when a count changes
- When "Same for all meals" is OFF:
  - Each tab has its own independent counts
- Show total people count per active tab at top right
- If `personTypes.length === 0`: show empty state:
  ```
  No person types configured. [Add person type →]
  ```
- Inputs: type="number" min={0} step={1} inputMode="numeric"
- Save on change (the parent handles debouncing/API calls via `onPersonCountChange`)
- Use `components/ui/card.tsx` as the outer container
- Use `components/ui/switch.tsx` for the "Same for all meals" toggle
- "Same for all meals" state is LOCAL to this component (no prop needed)

**Localization keys to use in this component:**
- `menus.personCounts` → "People Counts"  
- `menus.sameForAllMeals` → "Same for all meals"
- `menus.totalPeople` → "Total"
- `menus.noPersonTypesConfigured` → "No person types configured."
- `menus.addPersonType` → "Add person type"
- The meal type labels: hardcode "Breakfast" / "Lunch" / "Dinner" / "Snack" for now (no i18n key needed)

---

## Task 2: Integrate PersonCountsPanel into menus/page.tsx

**File:** `app/(protected)/menus/page.tsx`

Read this file first, then:

1. Import `PersonCountsPanel` from `@/components/menu/person-counts-panel`
2. Add it between the `EnhancedStatsGrid` and the `MenuGrid` sections:
   ```tsx
   {loadingStates.stats ? (
     <EnhancedStatsGridSkeleton />
   ) : (
     <EnhancedStatsGrid stats={getStatsForTab()} />
   )}
   
   {/* NEW: Person Counts Panel */}
   {!loadingStates.menus && personTypes.length >= 0 && (
     <PersonCountsPanel
       personTypes={personTypes}
       personCountsByMealType={personCountsByMealType}
       onPersonCountChange={handlePersonCountChange}
       onAddPersonType={() => setPersonTypeDialogOpen(true)}
     />
   )}
   
   {loadingStates.menus ? (
     <MenuGridSkeleton />
   ) : (
     <MenuGrid ... />
   )}
   ```

3. Keep passing `personCountsByMealType` and `personTypes` to `MenuGrid` — the card header badges still need them for display.
4. Remove the `onAddPersonType` prop from `MenuGrid` call since that's now handled by `PersonCountsPanel`.

---

## Task 3: Update MenuCard to Remove Per-Card People Dialog

**File:** `components/menu/menu-card.tsx`

Read the file first. Then:

1. **REMOVE** (delete these entirely, do not comment out):
   - `const [peopleDialogOpen, setPeopleDialogOpen] = useState(false);`
   - The entire `<BaseDialog open={peopleDialogOpen} ...>` block (the one titled `People for ${title}`)
   - The `<Button size="icon" variant="outline" onClick={() => setPeopleDialogOpen(true)}>` button (the Users icon button)
   - The `BaseDialog` import if it's no longer used after removing the dialog

2. **KEEP** (these are fine as-is):
   - The `countSummary` useMemo
   - The `totalPeople` useMemo
   - The count summary chips in the card header (`{countSummary.length > 0 && (...)})`)
   - All props: `personTypes`, `personCounts`, `onPersonCountChange`, `onAddPersonType` — keep them even if some are now unused, to avoid breaking MenuGrid's prop passing (we can clean up later)

3. **CHANGE** the header layout: since the Users button is removed, the header actions div now only has the "Add" button. Keep the same flex layout.

---

## Task 4: Auto-Apply Suggestion in AddMealDialog

**File:** `components/dialogs/add-meal-dialog.tsx`

Read the file first. It is large (~1800 lines). The "Consumption planner" section is around lines 1507–1654.

**Changes:**

### 4a. Auto-apply on dialog open (create mode)
Find the `useEffect` that watches `selectedMenuComponent` and `initialPersonCounts` (around line 799–817). After that effect, ADD:

```tsx
// Auto-apply consumption suggestion when dialog opens in create mode
useEffect(() => {
  if (
    mode === "create" &&
    consumptionSuggestion &&
    !hasAppliedConsumptionSuggestion
  ) {
    // We need setFieldValue but we're outside Formik render — use a ref approach
    // Set a flag that Formik will pick up on next render
    setHasAppliedConsumptionSuggestion(false); // will be handled inside Formik render
  }
}, [mode, consumptionSuggestion, hasAppliedConsumptionSuggestion]);
```

Actually, since auto-apply requires `setFieldValue` from Formik, the right approach is:
In the Formik render function, add an effect via `useEffect` inside the render prop... but that's not possible.

Better approach: In the `getInitialValues` function, when mode is "create" and we have a `consumptionSuggestion`, seed the initial values with the suggestion. But `consumptionSuggestion` depends on `personCounts` which depends on `initialPersonCounts`.

**Simplest approach that works:**
- Add a `useEffect` that fires when `consumptionSuggestion` becomes non-null AND `!hasAppliedConsumptionSuggestion` AND mode === "create":
  - Store the suggestion in a `pendingAutoApply` ref
  - The Formik `<Formik key=...>` re-renders when `initialFormValues` changes — instead, update initialFormValues to include the suggestion

Actually the cleanest approach: 
- In `getInitialValues`, pass `consumptionSuggestion` as a param
- When suggestion is available for create mode, use suggestion values as defaults

Modify `getInitialValues` signature:
```ts
const getInitialValues = useCallback(
  (meal, recipes, suggestion?: ConsumptionSuggestion | null): MealFormValuesWithGroups => {
    // ... existing logic ...
    // At the end of the create mode path:
    return {
      ...existingDefaults,
      preparedQuantity: suggestion?.preparedQuantity ?? 0,
      preparedQuantityUnit: suggestion?.preparedQuantityUnit ?? DEFAULT_UNIT,
      servingQuantity: suggestion?.servingQuantity ?? 0,
      servingQuantityUnit: suggestion?.servingQuantityUnit ?? DEFAULT_UNIT,
      quantityPerPiece: suggestion?.quantityPerPiece ?? undefined,
    };
  }
```

And update the `initialFormValues` useMemo:
```ts
const initialFormValues = useMemo(
  () => getInitialValues(fetchedMenu || initialMeal, recipes, mode === "create" ? consumptionSuggestion : null),
  [fetchedMenu, initialMeal, recipes, consumptionSuggestion, mode, getInitialValues],
);
```

But this causes re-renders every time counts change... which is actually fine for create mode.
Mark `hasAppliedConsumptionSuggestion` as true when consumptionSuggestion is applied.

**Simplest working solution:** 
1. In the Formik render, add a `useImperativeRef` or just use a `useEffect` inside a wrapper. 
2. Actually the simplest: Use `enableReinitialize` (already set) + update `initialFormValues` when suggestion changes.

Since `enableReinitialize={true}` is already set on Formik, and `initialFormValues` is already memoized, just pass `consumptionSuggestion` to `getInitialValues` when mode === "create":

```ts
const initialFormValues = useMemo(
  () => getInitialValues(
    fetchedMenu || initialMeal, 
    recipes, 
    mode === "create" && !hasAppliedConsumptionSuggestion ? consumptionSuggestion : null
  ),
  [fetchedMenu, initialMeal, recipes, consumptionSuggestion, mode, hasAppliedConsumptionSuggestion, getInitialValues],
);
```

Update `getInitialValues` to accept optional suggestion:
```ts
const getInitialValues = useCallback(
  (
    meal?: AddMealDialogProps["initialMeal"],
    recipes?: Recipe[],
    suggestion?: ConsumptionSuggestion | null,
  ): MealFormValuesWithGroups => {
    // ... existing logic for update mode unchanged ...
    // In create mode (the `return { recipeCategory: "all", ... }` block), use suggestion values:
    return {
      recipeCategory: "all",
      recipeSubcategory: "all",
      recipeId: "",
      customName: "",
      followRecipe: false,
      ghanFactor: 1.0,
      servingQuantity: suggestion?.servingQuantity ?? 0,
      servingQuantityUnit: suggestion?.servingQuantityUnit ?? DEFAULT_UNIT,
      preparedQuantity: suggestion?.preparedQuantity ?? 0,
      preparedQuantityUnit: suggestion?.preparedQuantityUnit ?? DEFAULT_UNIT,
      quantityPerPiece: suggestion?.quantityPerPiece ?? undefined,
      menuComponentId: meal?.menuComponentId,
      kitchenId: "",
      cook: "",
      ingredientGroups: [/* ... existing empty group ... */],
    };
  },
```

### 4b. Remove editable person count inputs, show read-only summary

In the "Consumption planner" section (inside the CardContent), find the grid of person count inputs (around lines 1535–1593):
```tsx
<div className="mt-3 grid gap-2 md:grid-cols-[minmax(0,1fr)_14rem]">
  <div className="grid gap-2 xl:grid-cols-2">
    {selectedMenuComponent.averages.map((average) => (
      <div key={average.id} ...>
        {/* Person count input per person type */}
        <Input
          id={`person-count-${average.personTypeId}`}
          type="number"
          ...
          onChange={(event) => {
            setPersonCounts(...);
          }}
        />
      </div>
    ))}
  </div>
  {/* Suggestion summary on the right */}
</div>
```

**Replace the editable inputs with read-only display:**
```tsx
<div className="mt-3 rounded-md border border-border bg-muted/30 p-3">
  <p className="text-xs font-medium text-muted-foreground mb-2">Based on:</p>
  <div className="flex flex-wrap gap-2">
    {selectedMenuComponent.averages.map((average) => (
      <span key={average.id} className="inline-flex items-center gap-1 rounded-md bg-background border border-border px-2 py-1 text-xs">
        <span className="font-medium">{average.personType.name}</span>
        <span className="text-muted-foreground">{personCounts[average.personTypeId] || 0}</span>
      </span>
    ))}
  </div>
  {consumptionSuggestion && (
    <div className="mt-3 flex flex-wrap gap-4 text-sm">
      <div>
        <span className="text-xs text-muted-foreground">Suggested </span>
        <span className="font-medium">{formatDecimal(consumptionSuggestion.preparedQuantity)} {consumptionSuggestion.preparedQuantityUnit}</span>
      </div>
      <div>
        <span className="text-xs text-muted-foreground">Per person </span>
        <span className="font-medium">{formatDecimal(consumptionSuggestion.servingQuantity)} {consumptionSuggestion.servingQuantityUnit}</span>
      </div>
      <div>
        <span className="text-xs text-muted-foreground">People </span>
        <span className="font-medium">{consumptionSuggestion.totalPersons}</span>
      </div>
    </div>
  )}
</div>
```

Remove the old separate suggestion summary box (the one with `consumptionSuggestion ? (...)` on the right side of the grid).

Keep the "Apply suggestion" / "Recalculate" button but rename it:
- If `hasAppliedConsumptionSuggestion`: show "Recalculate" (small, secondary)
- If not applied: show "Apply" (if for some reason auto-apply didn't run)

### 4c. Rename "Consumption planner" → "Quantities"
Find `CardTitle` with "Consumption planner" and change to something cleaner. Actually the CardTitle shows "quantityInformation" via t("recipes.quantityInformation"). Keep that translation key but let's change the section.

Actually the card header has:
```tsx
<CardTitle>{t("recipes.quantityInformation")}</CardTitle>
```
Keep that but just focus on removing the person count inputs.

### 4d. Add Ghan Factor tooltip
Wrap the ghan factor label + input with a Tooltip:
```tsx
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

<TooltipProvider>
  <Tooltip>
    <TooltipTrigger asChild>
      <Label className="mb-1 block text-xs font-medium text-foreground cursor-help">
        {t("meals.ghan")} ⓘ
      </Label>
    </TooltipTrigger>
    <TooltipContent>
      <p className="max-w-xs text-xs">Number of recipe batches to prepare. 1 = one full recipe batch.</p>
    </TooltipContent>
  </Tooltip>
</TooltipProvider>
```

---

## Task 5: Rename "Averages" → "Portions" in MenuCard

**File:** `components/menu/menu-card.tsx`

After Task 3 changes:

1. Find the `SlidersHorizontal` button with label "Averages":
```tsx
<Button
  size="sm"
  variant="ghost"
  className="h-8 px-2 text-muted-foreground hover:bg-muted"
  title={`Edit averages for ${component.label}`}
  onClick={(event) => { ... }}
>
  <SlidersHorizontal className="mr-1 h-4 w-4" />
  Averages
</Button>
```

Replace with (wrap in Tooltip):
```tsx
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

<TooltipProvider>
  <Tooltip>
    <TooltipTrigger asChild>
      <Button
        size="sm"
        variant="ghost"
        className="h-8 px-2 text-muted-foreground hover:bg-muted"
        onClick={(event) => { event.stopPropagation(); onEditMenuComponent?.(component); }}
      >
        <SlidersHorizontal className="mr-1 h-4 w-4" />
        Portions
      </Button>
    </TooltipTrigger>
    <TooltipContent side="top">
      <p className="max-w-xs text-xs">Set the typical amount each person type eats — used to auto-calculate preparation quantities</p>
    </TooltipContent>
  </Tooltip>
</TooltipProvider>
```

2. Also change the other SlidersHorizontal button (the one in the `item` branch, not the empty slot):
```tsx
<Button
  title={`Edit averages for ${component.label}`}  // change to "Edit portion sizes for ..."
  ...
>
  <SlidersHorizontal className="w-4 h-4" />
</Button>
```

---

## Task 6: Add i18n Keys

**File:** `locales/en/common.json` and `locales/gu/common.json`

Read both files first. Then add these keys:

In `menus` section:
```json
"sameForAllMeals": "Same for all meals",
"personCounts": "People Counts",
"totalPeople": "Total",
"noPersonTypesConfigured": "No person types configured.",
"addPersonType": "Add person type"
```

In `meals` section (check if these already exist first):
```json
"autoCalculated": "Auto-calculated from person counts",
"recalculate": "Recalculate",
"basedOn": "Based on"
```

For Gujarati (`locales/gu/common.json`), add the same keys with English values (will be translated later).

---

## Implementation Order
1. Task 6 (i18n keys) — needed by all components
2. Task 1 (PersonCountsPanel) — new file, no risk
3. Task 2 (integrate panel into menus/page.tsx) — depends on Task 1
4. Task 3 (remove People dialog from MenuCard) — independent
5. Task 4 (auto-apply in AddMealDialog) — most complex, do last
6. Task 5 (rename Averages → Portions) — simple rename

## Do Not Change
- The actual API calls for saving counts (already correct in menus/page.tsx)
- The `personCountsByMealType` data structure
- The `AddEditMenuComponentDialog` (it's fine as-is)
- Report pages
- Any files not listed above
