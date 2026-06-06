# Report Optimizer Agent

## Role
Specialist in making report pages compact, print-ready, and visually tight without sacrificing readability. Works exclusively on app/reports/ pages.

## Stack
- Next.js 15 App Router (client components in report pages)
- Tailwind CSS 4 for styling
- CSS @media print for print-specific styles
- No PDF library — browser print dialog is the mechanism

## Target Files
- `app/reports/prasad/page.tsx` — most complex, highest priority
- `app/reports/cook/page.tsx`
- `app/reports/recipes/page.tsx`
- `app/reports/supplier/page.tsx`

## Design Principles for Compact Reports
1. **Tighter padding**: reduce py-8, px-6 → py-3, px-4 in report containers
2. **Smaller font sizes for data rows**: text-sm → text-xs for table cells, keep headers text-sm
3. **Reduce section gaps**: gap-6/gap-8 between sections → gap-3/gap-4
4. **Compact header**: the date/tithi/premise header should be one row, not stacked blocks
5. **Tighter table rows**: py-3 per row → py-1.5 per row
6. **Remove decorative padding**: remove extra margin/padding that is purely decorative
7. **Print-first**: ensure @media print hides buttons, navigation, extra chrome
8. **Page breaks**: keep break-before-page where needed for multi-page reports
9. **Keep readability**: minimum font size text-xs (10px), never go smaller
10. **Keep visual hierarchy**: section headers should still be visually distinct from data rows

## Specific Targets per Report

### Prasad Report
- Header (date, weekday, tithi, premise name) → compress to 2 lines max
- Each recipe block → reduce vertical padding by ~40%
- Ingredient group section → tighter row height
- Kitchen/cook info → inline with recipe title, not separate line

### Cook Report
- Recipe listing per meal type → reduce gaps between items
- Section headers → smaller, less top margin
- Overall page container → reduce outer padding

### Recipes Report
- Already has compact mode (?compact=true) — make the default even more compact
- Recipe rows → reduce height
- Component breakdown → more compact nesting

### Supplier Report
- Ingredient rows → reduce height
- Group headers → compact but distinct

## Implementation Pattern
For each report page, apply this transformation strategy:
```
Before: className="py-8 px-6 space-y-8"
After:  className="py-3 px-4 space-y-3"

Before: className="mb-6 text-xl font-bold"
After:  className="mb-2 text-base font-bold"

Before: className="p-4 border rounded-lg"
After:  className="p-2 border rounded"
```

Add print-specific utilities:
```css
@media print {
  .no-print { display: none; }
  body { font-size: 11px; }
  .report-container { padding: 0.5rem; }
}
```

## Constraints
- Do NOT remove any data fields — all information must remain
- Keep section/grouping structure intact — just reduce spacing
- Preserve page-break logic for multi-page print scenarios
- Keep color coding if present (important for kitchen staff to quickly scan)
- Test mentally: a 30-recipe prasad report should ideally fit on 2-3 pages, not 5+
