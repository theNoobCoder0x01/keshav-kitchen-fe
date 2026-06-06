---
name: orchestrator
description: Master orchestrator for all Keshav Kitchen projects. Coordinates UI/UX overhaul agents (Phases 1-3) and the DevX/CI/CD overhaul agents (Phase 4+). Routes sub-tasks to specialists, enforces quality gates, and integrates all deliverables.
tools: Read, Write, Edit, Bash, Agent
---

# Master Orchestrator — Keshav Kitchen

---

## PHASE 4: DevX & CI/CD Overhaul (current active phase)

### Objective
Transform the development workflow from "deploy-to-Docker-to-test" into a frictionless local experience. End state: **`cp .env.local.example .env.local && npm run dev` just works**.

### Agent Roster (Phase 4)
| Agent File | Responsibility | Output Files |
|---|---|---|
| `devx-engineer.md` | Local dev scripts, env template, DB-only Docker compose | `.env.local.example`, `docker-compose.db-only.yml`, updated `package.json` scripts |
| `db-connectivity.md` | SSH tunnel script for remote dev DB | `scripts/tunnel-dev-db.sh` |
| `dependency-auditor.md` | Fix package.json conflicts, audit vulnerabilities | Updated `package.json`, updated `.npmrc` |
| `devops-engineer.md` | GitHub Actions CI/CD pipeline | `.github/workflows/*.yml` |

### Execution Plan (Phase 4)

#### Step 1 — Foundation (run dependency-auditor + db-connectivity in parallel)
These two are fully independent.

- **dependency-auditor**: fixes `package.json` (removes unused `prototype`, documents peer dep situation), updates `.npmrc` with explanatory comment
- **db-connectivity**: creates `scripts/tunnel-dev-db.sh`

#### Step 2 — DevX Core (after Step 1 — reads updated package.json)
- **devx-engineer**: creates `.env.local.example`, `docker-compose.db-only.yml`, adds npm scripts

#### Step 3 — CI/CD (parallel with Step 2)
- **devops-engineer**: creates all three GitHub Actions workflows

#### Step 4 — Validation
Verify all files exist and pass syntax checks.

### Phase 4 Quality Gates
- [ ] `.env.local.example` exists with 3 DB options, no real secrets
- [ ] `.env.local.example` listed in `.gitignore` exceptions
- [ ] `docker-compose.db-only.yml` valid YAML
- [ ] `scripts/tunnel-dev-db.sh` passes `bash -n` syntax check
- [ ] `package.json` has all new dev scripts and is valid JSON
- [ ] `.github/workflows/ci.yml` exists and is valid YAML
- [ ] `.github/workflows/deploy-dev.yml` exists and is valid YAML
- [ ] `.github/workflows/deploy-prod.yml` exists and is valid YAML
- [ ] `prototype` removed from devDependencies (if confirmed unused)

---

## PHASES 1–3: UI/UX Overhaul (completed)

### Team Roster
| Agent | File | Domain |
|-------|------|--------|
| UX Analyst | `ux-analyst.md` | Maps friction points, defines improvements per flow |
| Report Optimizer | `report-optimizer.md` | Compacts report pages, improves print layout |
| UI Developer | `ui-developer.md` | Improves global UI: layout, typography, spacing, components |
| Flow Developer | `flow-developer.md` | Fixes each user flow end-to-end, dialog UX, navigation |
| Quality Checker | `quality-checker.md` | Verifies correctness, no regressions, i18n compliance |
| Menu UX Developer | `menu-ux-developer.md` | Person counts panel, AddMealDialog auto-calc, MenuCard cleanup |
| Round 2 UX Developer | `round2-ux-developer.md` | Phase 3 UX polish and critical bug fixes |

### Phase 1–3 Summary
- Phase 1: Full UI/UX audit → report compaction → flow fixes → quality check
- Phase 2: Menu UX deep overhaul (PersonCountsPanel, AddMealDialog, Portions rename)
- Phase 3: Critical bug fixes (recipe delete confirm, filter chrome, empty states, i18n)

---

## Global Quality Gates (all phases)
- No TypeScript errors introduced
- All user-visible strings use t() with keys in both locale files
- No window.confirm / window.alert remaining
- Reports print cleanly via browser print dialog
- Tailwind CSS only — no inline style sprawl
- Mobile responsiveness preserved
- No secrets hardcoded in committed files
- All shell scripts pass `bash -n` syntax check
