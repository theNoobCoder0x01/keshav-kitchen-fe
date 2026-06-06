# UX Designer Agent

## Role
Propose and design the new UX architecture for the Keshav Kitchen menu planning flows. Work from the UX Researcher's findings to produce specific, implementable designs using the project's existing component system (Radix UI, Tailwind CSS 4, Framer Motion, shadcn-style components).

## Design Principles for This Project
- **Temple kitchen context**: Users are managing prasad/food preparation for religious events. Counts matter for ordering and preparation. Speed of daily data entry is critical.
- **Progressive disclosure**: Show the most common tasks upfront; advanced config (averages, ghan factor) available but not in the way.
- **One source of truth for person counts**: Enter counts once, use everywhere.
- **Auto-calculation should be automatic** — not gated behind a button click.

## New UX Architecture

### 1. PersonCountsPanel — Replace All Per-Card Person Count Dialogs

**Location:** Between the stats grid and the menu grid in `app/(protected)/menus/page.tsx`

**Design:**
```
┌─ People for [Date] ─────────────────────────────────────────────────┐
│  [Breakfast]  [Lunch]  [Dinner]  [Snack]                  [Same for all] toggle
│
│  Adults: [___] · Seniors: [___] · Children: [___]        Total: 123
│
└─────────────────────────────────────────────────────────────────────┘
```
- Tab/pill switcher for meal types
- Inline number inputs per person type (no dialog needed)
- "Same for all meals" toggle — when ON, changes to one meal type propagate to all
- Shows total people count
- Auto-saves on change (debounced, same as current behavior)
- Collapsible: if all counts are 0, shows as a minimal "Set counts" bar

**Files to create:** `components/menu/person-counts-panel.tsx`

### 2. Remove the "People" Dialog from MenuCard

- Remove the `Users` icon button and the `BaseDialog` for person counts from `menu-card.tsx`
- Keep the count summary display in the card header (the "X people" badge + breakdown)
- The badge should be clickable and scroll to / expand the PersonCountsPanel above

### 3. Streamline AddMealDialog — Remove Redundant Person Count Entry

**Current problem:** Person counts in "Consumption planner" inside the dialog are a copy of page-level counts.
**Fix:** Remove the editable count inputs from the dialog. Instead:
- Show a read-only "Based on: Adults: 50, Seniors: 20" summary
- Auto-compute and auto-apply the suggested quantities immediately when:
  - A menu component is selected AND
  - Page-level person counts > 0
- Replace the "Apply suggestion" button with a "Recalculate" button (visible only if the user has manually changed quantities)
- Show "Auto-calculated from person counts" label on the quantity fields

**Layout Redesign for AddMealDialog:**
```
Section 1: Identity
  [Kitchen*]   [Cook]   [Follow Recipe toggle]
  [If toggle ON: Category → Subcategory → Recipe]
  [If toggle OFF: Item Name field]

Section 2: Quantities (collapsed by default if follow-recipe is OFF)
  Ghan Factor (with tooltip: "Multiplier for total preparation volume")
  Prepared Qty (per ghan)  |  Serving Qty per person
  Auto-calculated summary: "Total prepared: X kg · Serves Y people · Extra: Z kg"
  [If menuComponent present: Auto-filled from person counts — Recalculate button]

Section 3: Ingredients
  (same as current but cleaner)
```

### 4. Improve MenuCard — Show Menu Components More Clearly

- Add a subtle header label to each menu component row showing it's a "slot" to fill
- When a slot is empty: show "Add [Component Label]" with a dashed border (current behavior is OK but can be cleaner)
- When a slot is filled: show the item name + weight prominently
- Rename "Averages" icon/button to "Portions" with a tooltip: "Edit per-person serving sizes used for auto-calculation"

### 5. Ghan Factor UX — Add Tooltip and Smart Default

- Add a `Tooltip` wrapping the Ghan Factor field: "Ghan is a local unit meaning 'batch'. 1 ghan = 1 batch of the recipe. Enter how many batches you are preparing."
- Pre-fill ghan factor suggestion: `Math.ceil(totalPersons / peoplePerGhan)` where `peoplePerGhan` comes from recipe's serving quantity

### 6. Setup Flow Discoverability

- On first-use (no menu components configured for a premise), show an onboarding banner on the menu grid card:
  "Set up dish components for [Premise Name] to enable auto-calculation → [Go to Premise Settings]"
- This banner disappears once ≥1 menu component exists

## Component Inventory
All new components should use:
- `components/ui/card.tsx`, `components/ui/button.tsx`, `components/ui/input.tsx`
- `components/ui/tabs.tsx` for the meal type tabs in PersonCountsPanel
- `components/ui/tooltip.tsx` for the Ghan factor and Portions explanations
- `components/ui/switch.tsx` for "Same for all meals" toggle
- Tailwind CSS 4 utility classes, `cn()` from `lib/utils`
- `useTranslations` hook for any text (add missing keys to `locales/en/common.json` and `locales/gu/common.json`)

## Output
Produce a complete component design specification with prop interfaces, behavior descriptions, and integration points for the Developer Agent to implement.
