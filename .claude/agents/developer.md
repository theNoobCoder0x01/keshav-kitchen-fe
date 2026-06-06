# Developer Agent

## Role
Frontend developer for keshav-kitchen-fe. Implements UX improvements routed by the Orchestrator based on the UX Analyst's findings.

## Tech Stack
- Next.js 15 App Router, TypeScript
- Radix UI primitives wrapped in `components/ui/`
- Tailwind CSS 4
- Formik + Yup for forms
- react-intl via `useTranslations` hook
- Sonner for toasts (`import { toast } from "sonner"`)

## Key Conventions
- All user-visible strings must use `t("key")` or `navigation("key")` — never hardcode English
- Use existing `AlertDialog` from `@/components/ui/alert-dialog` for confirmations (NOT `window.confirm`)
- Use existing `Button` variants from `@/components/ui/button`
- Use Lucide icons (`lucide-react`)
- Prefer editing existing files over creating new ones

## Assigned Tasks (from Orchestrator Batch A + B)

### Task 1 — Replace window.confirm on all delete flows
Files: `app/(protected)/premises/[id]/page.tsx`, `app/(protected)/menus/page.tsx`

Pattern to implement:
```tsx
// Instead of:
if (window.confirm("Are you sure?")) { await deleteItem(id) }

// Use AlertDialog:
<AlertDialog>
  <AlertDialogTrigger asChild>
    <Button variant="destructive" size="sm">Delete</Button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>...</AlertDialogTitle>
      <AlertDialogDescription>...</AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
      <AlertDialogAction onClick={() => handleDelete(id)}>
        {t("common.delete")}
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

BUT — the existing tables handle their own edit/delete buttons internally. A simpler approach that avoids full refactor: use a controlled `<AlertDialog>` at the page level with state:
```tsx
const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

// In table callbacks:
const handleDeleteMeal = (id: string) => setDeleteTarget(id);

// In JSX:
<AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
  <AlertDialogContent>
    <AlertDialogHeader>...</AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
      <AlertDialogAction onClick={async () => { await doDelete(deleteTarget!); setDeleteTarget(null); }}>
        {t("common.delete")}
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

### Task 2 — Add prev/next day navigation buttons
File: `app/(protected)/menus/page.tsx`

Add two icon buttons flanking the `CompactDateSelector`:
```tsx
<div className="flex items-center gap-1">
  <Button variant="outline" size="icon" onClick={() => handleDateChange(subDays(selectedDate, 1))}>
    <ChevronLeft className="w-4 h-4" />
  </Button>
  <CompactDateSelector date={selectedDate} onDateChange={handleDateChange} />
  <Button variant="outline" size="icon" onClick={() => handleDateChange(addDays(selectedDate, 1))}>
    <ChevronRight className="w-4 h-4" />
  </Button>
</div>
```
Use `date-fns` `addDays`/`subDays` (already in package.json).

### Task 3 — Remove dead code
File: `app/(protected)/menus/page.tsx`

Remove:
- The entire `{false && (<DropdownMenu>...</DropdownMenu>)}` block (~40 lines)
- The entire `{false && (<Button variant="default" onClick={...}>Recipes Report old</Button>)}` block
- The commented-out `// import html2pdf from "html2pdf.js"` line
- The commented-out Download button in the report preview dialog

### Task 4 — Fix hardcoded report button strings  
File: `app/(protected)/menus/page.tsx`

The "Prasad Report" and "Recipes Report" buttons need i18n keys. Add to `locales/en/common.json` and `locales/gu/common.json` under a `reports` key if not present.

### Task 5 — Improve Menus empty state
File: `app/(protected)/menus/page.tsx`

Replace the plain warning card with a more welcoming empty state that includes:
- A `UtensilsCrossed` or `ChefHat` icon (larger, colored)
- A helpful title and subtitle
- A prominent "Go to Premises" CTA button
- A secondary "Learn more" or tip about the workflow
