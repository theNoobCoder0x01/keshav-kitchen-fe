# Round 2 UX Developer Agent

## Role
Fix specific UX problems in the Keshav Kitchen frontend. Focus: critical bug (missing delete confirmation), heavy UI chrome reduction, contextual guidance, and small but high-impact polish changes.

## Project Conventions
- Next.js 15 App Router, TypeScript, Tailwind CSS 4
- Components: `components/ui/` — Card, Button, Input, Select, Badge, AlertDialog, Tooltip from there
- i18n: `useTranslations` hook, keys in both `locales/en/common.json` AND `locales/gu/common.json`
- Icons: lucide-react
- Path alias `@/` = repo root
- `cn()` from `@/lib/utils`
- NO new npm packages
- No comments unless WHY is non-obvious
- Read files before editing them

---

## TASK 1 — [CRITICAL] Add Delete Confirmation to Recipe Delete

**File:** `app/(protected)/recipes/page.tsx`

**Problem:** `handleDeleteRecipe` is called directly from the table's `onDelete` prop with no confirmation dialog. Users can accidentally delete recipes permanently.

**Fix:**
1. Add state: `const [recipeToDelete, setRecipeToDelete] = useState<string | null>(null);`
2. Change the `onDelete` prop call to: `onDelete={(id) => setRecipeToDelete(id)}`  
3. Rename `handleDeleteRecipe(id)` → call it only from a `confirmDeleteRecipe` function that clears the state and does the actual delete
4. Add an `AlertDialog` at the bottom of the JSX:

```tsx
<AlertDialog open={!!recipeToDelete} onOpenChange={(open) => !open && setRecipeToDelete(null)}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>{t("recipes.deleteRecipe")}</AlertDialogTitle>
      <AlertDialogDescription>
        {t("messages.confirmDeleteRecipeDesc")}
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
      <AlertDialogAction
        onClick={confirmDeleteRecipe}
        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
      >
        {t("common.delete")}
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

5. Import `AlertDialog*` from `@/components/ui/alert-dialog` (already in the project)
6. Add locale keys (see Task 7)

---

## TASK 2 — Simplify Recipes Filter Section

**File:** `app/(protected)/recipes/page.tsx`

**Problem:** The filter area is wrapped in a full `<Card>` with `<CardHeader>`, `<CardTitle>` with Search icon + text, `<CardDescription>`, and `<CardContent>`. This is ~6 levels of nesting just to show a search field and 2 dropdowns.

**Fix:** Replace the entire Card-wrapped filter section with a lean inline layout:

**BEFORE:** The `<Card>` with CardHeader/CardTitle/CardDescription containing the filter elements.

**AFTER:** A simple `<div>` with compact layout:

```tsx
{/* Search and Filters */}
<div className="flex flex-col gap-2">
  {/* Row 1: Search + filter toggle + clear */}
  <div className="flex flex-col sm:flex-row gap-2">
    <div className="relative flex-1">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
      <Input
        placeholder={t("recipes.searchPlaceholder")}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="pl-9"
      />
    </div>
    <Button
      variant="outline"
      size="sm"
      onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
      className="gap-2 shrink-0"
    >
      <Filter className="h-4 w-4" />
      {t("recipes.filters")}
      {(filterCategory !== "all" || filterSubcategory !== "all") && (
        <span className="ml-1 h-2 w-2 rounded-full bg-primary inline-block" />
      )}
    </Button>
    {(searchTerm || filterCategory !== "all" || filterSubcategory !== "all") && (
      <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-2 shrink-0 text-muted-foreground">
        <RefreshCw className="h-4 w-4" />
        {t("recipes.clear")}
      </Button>
    )}
  </div>

  {/* Row 2: Category + Subcategory selects (collapsible) */}
  {showAdvancedFilters && (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      <Select value={filterCategory} onValueChange={setFilterCategory}>
        <SelectTrigger>
          <SelectValue placeholder={t("recipes.allCategories")} />
        </SelectTrigger>
        <SelectContent searchable>
          {categories.map((category) => (
            <SelectItem key={category} value={category}>
              {category === "all" ? t("recipes.allCategories") : category}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={filterSubcategory} onValueChange={setFilterSubcategory}>
        <SelectTrigger>
          <SelectValue placeholder={t("recipes.allSubcategories")} />
        </SelectTrigger>
        <SelectContent searchable>
          {subcategories.map((subcategory) => (
            <SelectItem key={subcategory} value={subcategory}>
              {subcategory === "all" ? t("recipes.allSubcategories") : subcategory}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )}

  {/* Active filter badges */}
  {(searchTerm || filterCategory !== "all" || filterSubcategory !== "all") && (
    <div className="flex flex-wrap gap-1.5">
      {searchTerm && (
        <Badge variant="secondary" className="gap-1 text-xs">
          {t("recipes.search")}: "{searchTerm}"
        </Badge>
      )}
      {filterCategory !== "all" && (
        <Badge variant="secondary" className="gap-1 text-xs">
          {t("recipes.category")}: {filterCategory}
        </Badge>
      )}
      {filterSubcategory !== "all" && (
        <Badge variant="secondary" className="gap-1 text-xs">
          {t("recipes.subcategory")}: {filterSubcategory}
        </Badge>
      )}
    </div>
  )}
</div>
```

Keep all the existing state logic (searchTerm, filterCategory, filterSubcategory, showAdvancedFilters, etc.) unchanged. Only change the JSX rendering.

Also remove the unused `Card`, `CardContent`, `CardDescription`, `CardHeader`, `CardTitle` imports from this file IF they are no longer used after this change. Check if they're used elsewhere in the file first.

---

## TASK 3 — Premise Detail: Move Action Buttons, Add Guidance

**File:** `app/(protected)/premises/[id]/page.tsx`

**Problem:** Both "Add Person Type" and "Add Menu Component" buttons live only in the PageHeader actions at the top of the page. When the tables are long, users have to scroll all the way back up to add items. Also, empty sections give no guidance on what person types or menu components ARE.

**Fix A: Add section-level "Add" buttons next to each section header**

Find the section headers:
```tsx
<h2 className="mb-2 text-lg font-semibold">{t("premises.personTypes")}</h2>
<h2 className="mb-2 text-lg font-semibold">{t("premises.menuComponents")}</h2>
```

Replace each with a flex row containing the heading + an inline add button:
```tsx
{/* Person Types section */}
<div className="flex items-center justify-between mb-2">
  <h2 className="text-lg font-semibold">{t("premises.personTypes")}</h2>
  <Button
    size="sm"
    variant="outline"
    onClick={() => { setEditingPersonType(null); setPersonTypeDialogOpen(true); }}
  >
    <Plus className="mr-1 h-4 w-4" />
    {t("premises.addPersonType")}
  </Button>
</div>
```

Do the same for the Menu Components section.

**Fix B: Add helpful empty-state guidance**

When `personTypes.length === 0`, show a guidance card ABOVE the table:
```tsx
{personTypes.length === 0 && (
  <div className="rounded-lg border border-dashed border-border p-4 mb-3 text-sm text-muted-foreground">
    <p className="font-medium text-foreground mb-1">{t("premises.personTypesEmptyTitle")}</p>
    <p>{t("premises.personTypesEmptyDescription")}</p>
  </div>
)}
```

When `menuComponents.length === 0`, same pattern:
```tsx
{menuComponents.length === 0 && (
  <div className="rounded-lg border border-dashed border-border p-4 mb-3 text-sm text-muted-foreground">
    <p className="font-medium text-foreground mb-1">{t("premises.menuComponentsEmptyTitle")}</p>
    <p>{t("premises.menuComponentsEmptyDescription")}</p>
  </div>
)}
```

The i18n keys:
- `premises.personTypesEmptyTitle`: "No person types yet"
- `premises.personTypesEmptyDescription`: "Add the types of people eating here (e.g. Adult, Senior, Child). These are used to track how many people each meal serves and to auto-calculate ingredient quantities."
- `premises.menuComponentsEmptyTitle`: "No dish components yet"
- `premises.menuComponentsEmptyDescription`: "Add the dishes served at this premise (e.g. Dal, Rice, Sabji). For each dish, you can set typical per-person quantities — the menu page will then auto-calculate how much to prepare based on your daily head count."

---

## TASK 4 — Fix MenuComponentsTable Hardcoded Strings

**File:** `components/menu/menu-components-table.tsx`

All column headers and empty states are hardcoded English. Fix them:

1. Add `const { t } = useTranslations()` — import `useTranslations` from `@/hooks/use-translations`  
   (The file currently does NOT use translations at all)

2. Replace hardcoded strings:
   - `"Sequence Number"` → `t("premises.sequenceNumber")`  
   - `"Name"` → `t("common.name")`
   - `"Label"` → `t("premises.menuComponentLabel")` (new key)
   - `"Meal Type"` → `t("premises.menuComponentMealType")` (new key)
   - `"Averages"` → `t("premises.menuComponentPortions")` (new key — rename from Averages)
   - `"Actions"` → `t("common.actions")`
   - `"No menu components found."` → `t("premises.noMenuComponentsFound")` (new key)
   - `"No averages configured."` → `t("premises.noPortionsConfigured")` (new key)

3. Add the new locale keys (see Task 7)

---

## TASK 5 — Dashboard: Surface Today's Date + Primary Action

**File:** `app/(protected)/page.tsx`

**Problem:** The dashboard shows stats and activity but doesn't immediately show TODAY'S DATE prominently. The primary daily action is "plan today's menu" but you have to find the button in the page header.

**Fix A:** Add a date + day banner as the FIRST thing under the page header:

```tsx
{/* Today's highlight bar */}
<div className="mb-6 flex items-center justify-between rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
  <div>
    <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Today</p>
    <p className="text-lg font-bold text-foreground">
      {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
    </p>
  </div>
  <Button onClick={() => router.push("/menus")} size="sm" className="gap-2">
    <ChefHat className="h-4 w-4" />
    Plan Menu
  </Button>
</div>
```

Place this right AFTER the `<PageHeader>` block, BEFORE the "Quick Actions" section.

Import `format` from `date-fns` if needed, or use `toLocaleDateString` (no import needed).

**Fix B:** Remove the percentage change from the stat cards — it's often 0% and adds confusion. Just show the number and a simple label.

Find the 3 stat cards in the stats grid section. For each one, change the `<p>` showing the `%` change to just an empty string or remove it. Keep the card structure but remove the change percentage:

- Remove: `<p className="text-xs text-muted-foreground mt-1">{...}% {t("dashboard.fromYesterday")}</p>`
- Replace with nothing (just remove the line) or a minimal indicator

---

## TASK 6 — Menus Page: Show Day Name in Date Area

**File:** `app/(protected)/menus/page.tsx`

**Problem:** The date navigation area only shows a compact date selector with prev/next buttons. Users can't immediately see what day of the week it is.

**Fix:** Add the weekday name next to the date selector in the PageHeader actions area.

Find the date navigation section in the actions prop:
```tsx
<div className="flex items-center gap-1">
  <Button variant="outline" size="icon" ...><ChevronLeft /></Button>
  <CompactDateSelector ... />
  <Button variant="outline" size="icon" ...><ChevronRight /></Button>
</div>
```

Wrap it with a day name label:
```tsx
<div className="flex items-center gap-2">
  <span className="hidden sm:block text-sm font-medium text-muted-foreground min-w-[90px] text-right">
    {selectedDate.toLocaleDateString("en-IN", { weekday: "long" })}
  </span>
  <div className="flex items-center gap-1">
    <Button variant="outline" size="icon" onClick={...}><ChevronLeft /></Button>
    <CompactDateSelector ... />
    <Button variant="outline" size="icon" onClick={...}><ChevronRight /></Button>
  </div>
</div>
```

---

## TASK 7 — Add All New i18n Keys

**Files:** `locales/en/common.json` AND `locales/gu/common.json`

Read both files first. Add these keys:

In `messages` section:
```json
"confirmDeleteRecipeDesc": "This will permanently delete the recipe and all its ingredients. This action cannot be undone."
```

In `premises` section:
```json
"personTypesEmptyTitle": "No person types yet",
"personTypesEmptyDescription": "Add the types of people eating here (e.g. Adult, Senior, Child). These are used to track how many people each meal serves and to auto-calculate ingredient quantities.",
"menuComponentsEmptyTitle": "No dish components yet",
"menuComponentsEmptyDescription": "Add the dishes served at this premise (e.g. Dal, Rice, Sabji). For each dish you can set typical per-person quantities — the menu page will then auto-calculate how much to prepare.",
"menuComponentLabel": "Label",
"menuComponentMealType": "Meal Type",
"menuComponentPortions": "Portions",
"noMenuComponentsFound": "No menu components found.",
"noPortionsConfigured": "No portions configured."
```

For Gujarati (`locales/gu/common.json`): Add the same keys with English text as placeholder (will be translated later). Check if any of the keys already exist before adding to avoid duplicates.

---

## Implementation Order
1. Task 7 (i18n keys) — all tasks depend on these
2. Task 1 (recipe delete confirmation) — critical bug
3. Task 4 (MenuComponentsTable hardcoded strings)
4. Task 3 (premise detail buttons + empty states)
5. Task 2 (simplify recipes filter)
6. Task 5 (dashboard today banner + remove % change)
7. Task 6 (menus page day name)

## After All Tasks
Run: `npx tsc --noEmit 2>&1 | grep -v ".next/types\|chart.tsx\|resizable.tsx\|auth.ts\|crypto-utils"` to check only our files for TypeScript errors. Fix any errors introduced.
