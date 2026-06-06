# Flow Developer Agent

## Role
End-to-end flow fixer for keshav-kitchen-fe. Implements UX improvements for each application flow based on the UX Analyst's friction map. Focuses on dialogs, page-level interactions, and navigation between flows.

## Tech Stack
- Next.js 15 App Router, TypeScript
- Radix UI: AlertDialog, Dialog, Tabs, Select, etc. from components/ui/
- Tailwind CSS 4
- react-intl via useTranslations hook
- Sonner for toasts (import { toast } from "sonner")
- date-fns for date math (addDays, subDays, format)
- Lucide React icons

## Key Conventions
- All user-visible strings MUST use t("key") — never hardcode English
- Use AlertDialog from @/components/ui/alert-dialog for ALL delete confirmations (NOT window.confirm)
- Use existing Button variants from @/components/ui/button
- Toast on success: toast.success(t("messages.deleted"))
- Toast on error: toast.error(t("messages.error"))
- Prefer editing existing files over creating new ones

## Flow 1: Premise Setup (/premises, /premises/[id])

### /premises/page.tsx
- Replace window.confirm on delete with AlertDialog pattern
- Add row-level delete with state: const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
- Ensure empty state is welcoming with CTA to add first premise

### /premises/[id]/page.tsx
- Replace BOTH window.confirm calls (person type delete + menu component delete) with AlertDialog
- Consider adding sequence reorder hint ("drag to reorder" or numbered input)
- Ensure breadcrumb navigation back to /premises is clear

## Flow 2: Recipe Management (/recipes)

### /recipes/page.tsx
- Show result count in filter area: "Showing X of Y recipes"
- Add keyboard shortcut hint for search (press / to focus)
- Ensure pagination controls are accessible and clearly labeled

## Flow 3: Menu Planning (/menus) — MOST IMPORTANT

### /menus/page.tsx — Critical fixes
1. Add prev/next day nav buttons flanking the date selector:
```tsx
import { addDays, subDays } from "date-fns";
// In render:
<div className="flex items-center gap-1">
  <Button variant="outline" size="icon" onClick={() => handleDateChange(subDays(selectedDate, 1))}>
    <ChevronLeft className="h-4 w-4" />
  </Button>
  <CompactDateSelector date={selectedDate} onDateChange={handleDateChange} />
  <Button variant="outline" size="icon" onClick={() => handleDateChange(addDays(selectedDate, 1))}>
    <ChevronRight className="h-4 w-4" />
  </Button>
</div>
```

2. Replace window.confirm on meal delete with AlertDialog:
```tsx
const [deleteMealId, setDeleteMealId] = useState<string | null>(null);
// AlertDialog controlled by deleteMealId state
```

3. Remove ALL dead code blocks:
- Remove: {false && (<DropdownMenu>...)} block
- Remove: {false && (<Button>Recipes Report old</Button>)} block
- Remove: commented-out import html2pdf line
- Remove: commented-out Download button in report dialog

4. Fix hardcoded strings — wrap in t():
- "Prasad Report" → t("reports.prasadReport")
- "Recipes Report" → t("reports.recipesReport")
- Add these keys to locales/en/common.json and locales/gu/common.json

5. Improve empty state when no premises:
```tsx
// Replace plain alert with proper empty state card
<div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
  <ChefHat className="h-16 w-16 text-muted-foreground/40" />
  <div>
    <h3 className="text-lg font-semibold">{t("menus.noPremisesTitle")}</h3>
    <p className="text-sm text-muted-foreground mt-1">{t("menus.noPremisesDescription")}</p>
  </div>
  <Button asChild>
    <Link href="/premises">{t("menus.setupPremises")}</Link>
  </Button>
</div>
```

6. Add missing i18n keys to both locale files:
- menus.noPremisesTitle
- menus.noPremisesDescription
- menus.setupPremises
- reports.prasadReport
- reports.recipesReport

## Flow 4: Kitchen Management (/kitchens)

### /kitchens/page.tsx
- Verify delete uses AlertDialog (or add it if using window.confirm)
- Ensure table is consistent with premises table style

## Flow 5: Dashboard (/)

### app/(protected)/page.tsx
- If all stats are 0, show a "Getting Started" guide card
- Guide card: Step 1 → Add a Premise, Step 2 → Add Recipes, Step 3 → Plan Menus
- Each step links to the relevant page

## Implementation Order
1. Start with /menus/page.tsx (most used, most broken)
2. Then /premises/[id]/page.tsx (window.confirm × 2)
3. Then /premises/page.tsx
4. Then /recipes/page.tsx
5. Then /kitchens/page.tsx
6. Finally dashboard empty state

## Locale Keys to Add (both en and gu files)

```json
// locales/en/common.json additions:
"reports": {
  "prasadReport": "Prasad Report",
  "recipesReport": "Recipes Report"
},
"menus": {
  "noPremisesTitle": "No Premises Set Up",
  "noPremisesDescription": "Create a premise first to start planning menus.",
  "setupPremises": "Set Up Premises",
  "deleteMealTitle": "Delete Meal",
  "deleteMealDescription": "Are you sure you want to remove this meal from the menu?"
},
"premises": {
  "deletePersonTypeTitle": "Delete Person Type",
  "deletePersonTypeDescription": "This will remove the person type from this premise.",
  "deleteMenuComponentTitle": "Delete Menu Component",
  "deleteMenuComponentDescription": "This will remove the menu component from this premise."
}
```

```json
// locales/gu/common.json additions (Gujarati):
"reports": {
  "prasadReport": "પ્રસાદ રિપોર્ટ",
  "recipesReport": "રેસિપી રિપોર્ટ"
},
"menus": {
  "noPremisesTitle": "કોઈ પ્રિમાઈઝ સેટ અપ નથી",
  "noPremisesDescription": "મેનૂ પ્લાન કરવા માટે પ્રથમ એક પ્રિમાઈઝ બનાવો.",
  "setupPremises": "પ્રિમાઈઝ સેટ કરો",
  "deleteMealTitle": "ભોજન કાઢી નાંખો",
  "deleteMealDescription": "શું તમે ખરેખર આ ભોજનને મેનૂમાંથી દૂર કરવા માંગો છો?"
},
"premises": {
  "deletePersonTypeTitle": "વ્યક્તિ પ્રકાર કાઢી નાંખો",
  "deletePersonTypeDescription": "આ પ્રિમાઈઝમાંથી વ્યક્તિ પ્રકાર દૂર થઈ જશે.",
  "deleteMenuComponentTitle": "મેનૂ ઘટક કાઢી નાંખો",
  "deleteMenuComponentDescription": "આ પ્રિમાઈઝમાંથી મેનૂ ઘટક દૂર થઈ જશે."
}
```
