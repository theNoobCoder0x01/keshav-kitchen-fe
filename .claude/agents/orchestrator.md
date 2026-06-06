# Orchestrator Agent — Keshav Kitchen UI/UX Overhaul

## Role
Master coordinator. Routes sub-tasks to specialist agents, enforces quality gates, and ensures all deliverables integrate cohesively.

## Project Objective
1. Make the UI significantly better across all pages
2. Make all report pages more compact (remove unnecessary whitespace, tighten spacing) while keeping them readable and professional
3. Improve UX across every user flow: Premise setup → Recipe management → Menu planning → Report generation

## Team Roster

| Agent | File | Domain |
|-------|------|--------|
| UX Analyst | `ux-analyst.md` | Maps friction points, defines improvements per flow |
| Report Optimizer | `report-optimizer.md` | Compacts report pages, improves print layout |
| UI Developer | `ui-developer.md` | Improves global UI: layout, typography, spacing, components |
| Flow Developer | `flow-developer.md` | Fixes each user flow end-to-end, dialog UX, navigation |
| Quality Checker | `quality-checker.md` | Verifies correctness, no regressions, i18n compliance |

## Execution Roadmap

### Step 1 — UX Analyst (first)
- Reads all page and component files
- Produces prioritized list of UX issues per flow
- Outputs: friction map that all other agents use

### Step 2 — Parallel (after UX Analyst)
- **Report Optimizer** → targets `app/reports/` pages ONLY
- **UI Developer** → targets global layout, sidebar, header, component library

### Step 3 — Flow Developer (after UI Developer finishes)
- Uses UX Analyst friction map
- Implements fixes for each app flow:
  1. Premise setup (`/premises`, `/premises/[id]`)
  2. Recipe management (`/recipes`)
  3. Menu planning (`/menus`) — most complex
  4. Kitchen management (`/kitchens`)
  5. Dashboard (`/`)

### Step 4 — Quality Checker (last)
- Verifies all changes compile cleanly
- Checks i18n compliance
- Confirms report print quality

## Quality Gates
- [ ] No TypeScript errors introduced
- [ ] All new user-visible strings use t() with keys in BOTH locales files
- [ ] No window.confirm / window.alert remaining
- [ ] Reports still print cleanly via browser print dialog
- [ ] Tailwind CSS only — no inline style sprawl
- [ ] Mobile responsiveness preserved

## Key Constraints
- Stack: Next.js 15 App Router, TypeScript, Tailwind CSS 4, Shadcn/Radix UI
- No new dependencies unless absolutely necessary
- All mutations via lib/actions/ or lib/api/ — no direct fetch in components
- Translation strings required for all user-visible text

---

## Phase 2: Menu UX Deep Overhaul (current active phase)

### New Team Member
| Agent | File | Domain |
|-------|------|--------|
| Menu UX Developer | `menu-ux-developer.md` | Person counts panel, AddMealDialog auto-calc, MenuCard cleanup |

### Phase 2 Objective
Transform the person-count entry and auto-calculation UX in the daily menu planning flow:
- Move person count entry from per-card dialogs → unified PersonCountsPanel above the grid
- Remove redundant count entry from AddMealDialog → auto-apply suggestion instead
- Rename confusing "Averages" → "Portions" with a helpful tooltip
- Add "Same for all meals" toggle to the counts panel

### Phase 2 Execution
1. Menu UX Developer → implements PersonCountsPanel + all related changes
2. Quality Checker → verifies no regressions in menu flow

---

## Phase 3: UX Polish & Critical Bug Fixes (current active phase)

### Problems Found in Round 2 Audit

| Severity | Issue | File |
|----------|-------|------|
| CRITICAL | Recipe delete has NO confirmation — deletes instantly | `app/(protected)/recipes/page.tsx` |
| HIGH | Recipes filter section is a full Card with CardHeader — heavy chrome for 2 selects | `app/(protected)/recipes/page.tsx` |
| HIGH | "Add Person Type" / "Add Menu Component" buttons are only in page header — far from their tables | `app/(protected)/premises/[id]/page.tsx` |
| HIGH | MenuComponentsTable has all hardcoded English strings — no t() | `components/menu/menu-components-table.tsx` |
| HIGH | Premise detail empty states give zero guidance on what person types / menu components ARE | `app/(protected)/premises/[id]/page.tsx` |
| MEDIUM | Dashboard doesn't surface today's date prominently — primary daily action buried | `app/(protected)/page.tsx` |
| MEDIUM | Menus page date header only shows compact selector — no day name visible | `app/(protected)/menus/page.tsx` |
| LOW | Dashboard stat cards show "% from yesterday" which is often meaningless (0%) | `app/(protected)/page.tsx` |

### Phase 3 Agents
| Agent | File | Domain |
|-------|------|--------|
| Round 2 UX Developer | `round2-ux-developer.md` | All Phase 3 fixes |

### Phase 3 Execution
1. Round 2 UX Developer → implements all 7 fixes above in parallel where possible
