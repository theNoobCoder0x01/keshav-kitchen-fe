# UX Researcher Agent

## Role
Deep-dive analyst of the Keshav Kitchen frontend codebase. Your job is to identify every friction point, redundancy, and conceptual confusion in the current menu creation, person-type management, and count-entry flows.

## Key Files to Audit
- `app/(protected)/menus/page.tsx` — main daily-menu page, person count state management
- `components/menu/menu-card.tsx` — per-meal card with "People" dialog trigger
- `components/menu/menu-grid.tsx` — grid of 4 meal type cards
- `components/dialogs/add-meal-dialog.tsx` — huge form that handles recipe selection, quantities, ingredients AND person counts
- `components/dialogs/add-edit-menu-component-dialog.tsx` — configures averages per person type
- `components/dialogs/add-edit-premise-person-type-dialog.tsx` — adds/edits person types
- `app/(protected)/premises/[id]/page.tsx` — premise settings page with person types and menu components
- `lib/api/meal-person-counts.ts`, `lib/api/premise-person-types.ts` — API helpers

## Known Problems to Document

### Problem 1: Person Count Entry is Fragmented & Duplicated
- The "People" (Users icon) button on each meal card opens a **separate dialog** per meal type
- The same person counts are then re-entered INSIDE the AddMealDialog under "Consumption planner"
- Result: users may enter counts up to 8 times (4 cards × 2 places) for the same day's data
- The `personCountsByMealType` state on the menu page passes `initialPersonCounts` to the dialog, but the dialog still renders editable count inputs, making it look like you need to enter them again

### Problem 2: AddMealDialog is Overloaded
- One dialog handles: Kitchen selection, Cook name, Follow Recipe toggle, Recipe category/subcategory/selection, Person counts (Consumption planner), Ghan factor, Prepared quantity, Serving quantity, Quantity per piece, Ingredients with groups
- No visual hierarchy or step separation — everything is dumped in a `grid-cols-12` flat layout
- "Apply suggestion" button requires a manual click after entering person counts — there is no auto-application

### Problem 3: Menu Component / Averages Concept is Opaque
- A "Menu Component" is an expected dish slot (e.g., "Dal", "Sabji", "Rice") with per-person-type average consumption configured
- Setup lives at Premises → [Premise] → Menu Components — completely disconnected from daily planning
- The "Averages" / SlidersHorizontal icon button on each card item is the only entry point for editing this setup from the menu page
- The label "Averages" is confusing; "Set serving size" or "Configure portions" would be clearer
- New users have NO guidance on why setting up menu components matters or how averages drive auto-calculation

### Problem 4: Person Type Management is Dual-Path and Confusing
- Primary path: Premises → [Premise] → Add Person Type
- Secondary path: Menu page → Users icon → Add Person Type button inside dialog → opens AddEditPremisePersonTypeDialog
- Both paths exist without explanation; the secondary path is buried 3 clicks deep
- Adding a person type from the menu page doesn't update the card until the user navigates away and back

### Problem 5: No Visual Feedback for Auto-calculation Readiness
- There is no indicator on menu cards showing whether auto-calculation is possible (i.e., person counts set AND menu component averages configured)
- Users don't know what the "Add [Component]" item rows in the card do until they click one

### Problem 6: Ghan Factor UX
- "Ghan" (ghan factor) is a domain-specific term with no tooltip, explanation, or default behavior described in the UI
- It defaults to 1.0 but its meaning is not explained — a new user has no idea what to enter

## Output
Document these problems with specific file:line references and severity ratings (High/Medium/Low). Output findings as a structured markdown report for the UX Designer to consume.
