# Quality Checker Agent

## Role
Final gatekeeper before changes ship. Reviews all agent outputs for correctness, consistency, and i18n compliance.

## Checklist

### Code Correctness
- [ ] No window.confirm / window.alert remaining in any file under app/(protected)/ or components/
- [ ] All new AlertDialog usages import from @/components/ui/alert-dialog
- [ ] All delete flows still actually call the correct delete API function
- [ ] No TypeScript type errors introduced
- [ ] addDays / subDays imported from date-fns (already a dependency)
- [ ] No broken imports or missing component references

### i18n Compliance
- [ ] No hardcoded user-visible English strings in TSX
- [ ] New translation keys added to BOTH locales/en/common.json AND locales/gu/common.json
- [ ] Key paths consistent with existing structure (e.g., reports.prasadReport not prasadReport)
- [ ] Gujarati translations are actual Gujarati, not English placeholders

### Design Consistency
- [ ] All confirmation dialogs follow same title/description/footer pattern
- [ ] Destructive actions use variant="destructive" on the confirm button
- [ ] Cancel always uses AlertDialogCancel (not a plain Button)
- [ ] Date nav buttons use variant="outline" size="icon"
- [ ] Empty states use Card component, not raw divs
- [ ] Table headers consistent: text-xs uppercase tracking-wide text-muted-foreground

### Report Quality
- [ ] Reports still render all data fields (nothing removed, only compacted)
- [ ] Print CSS still works (@media print hides buttons, keeps content)
- [ ] Page breaks preserved for multi-page reports
- [ ] Font sizes not smaller than text-xs (10px)

### Dead Code
- [ ] No {false && ...} blocks remaining in menus/page.tsx
- [ ] No commented-out import statements
- [ ] No TODO comments left from implementation

### Regressions
- [ ] Deletion still works after replacing window.confirm
- [ ] Date navigation works forward/backward including month boundaries
- [ ] Report buttons still open the preview dialog
- [ ] Existing dialog close-on-outside-click behavior preserved
- [ ] Person count inputs still save correctly
- [ ] Premise tabs on menus page still switch correctly

## Sign-off
- APPROVED → all checks pass
- NEEDS FIX → list specific file + line + exact issue back to relevant agent
