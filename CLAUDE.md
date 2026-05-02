# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
npm run dev          # Start dev server
npm run build        # Production build
npm run start        # Start production server

# Code quality
npm run lint         # ESLint
npm run format       # Prettier

# Database
npm run db:generate  # Generate Prisma client after schema changes
npm run db:migrate   # Run migrations
npm run db:push      # Push schema without migration (dev only)
npm run db:seed      # Seed the database
npm run db:reset     # Drop and recreate database
npm run db:studio    # Open Prisma Studio

# Docker
npm run deploy:dev   # Start dev Docker environment
npm run deploy:prod  # Start prod Docker environment
npm run setup:dev    # Initial dev setup
npm run setup:prod   # Initial prod setup
```

> Note: ESLint and TypeScript errors are ignored during `next build` (see `next.config.mjs`). Run `lint` separately to catch issues.

## Architecture

**Next.js 15 App Router** with TypeScript. All routes live under `app/`, with protected routes under `app/(protected)/`. API endpoints are in `app/api/`.

### Data Layer

- **Database**: PostgreSQL via Neon (serverless) with Prisma ORM + Prisma Accelerate
- **Prisma client**: instantiated in `lib/prisma.ts` (singleton pattern for dev, Accelerate for prod)
- **Server Actions**: in `lib/actions/` — prefer these over API routes for mutations
- **API client utilities**: in `lib/api/` for client-side fetching

### Auth

NextAuth 4 with credentials provider (`lib/auth.ts`). Passwords use **Web Crypto API** (PBKDF2/SHA-256, 100k iterations) via `lib/crypto-utils.ts` — no Node.js `crypto` module, making it Edge Runtime compatible. Auto-migration from legacy bcryptjs hashes is handled there.

### UI

- **Radix UI primitives** wrapped as reusable components in `components/ui/`
- **Tailwind CSS 4** for styling
- **Framer Motion** for animations, **dnd-kit** for drag-and-drop (menus)
- **Lexical** for rich text editing in menu/recipe descriptions
- **Sonner** for toast notifications (hook at `hooks/use-toast.ts`)
- **Recharts** for data visualization in reports

### Forms & Validation

Both **Formik + Yup** and **React Hook Form + Zod** are used. Validation schemas live in `lib/validations/`. TypeScript types for forms are in `types/forms.ts`.

### Internationalization

**react-intl** with translation files in `locales/`. The active language is managed via React context (`lib/contexts/`). Use the `useTranslations` hook from `hooks/use-translations.ts`.

### Exports & Reports

Reports (PDF, Excel, CSV) are generated server-side using Puppeteer, ExcelJS, and fast-csv. Report pages/components live under `app/reports/` and `components/` report sections.

### Path Alias

`@/*` maps to the repository root. Use it for all internal imports.

### Environment

The base path is configurable via `NEXT_PUBLIC_BASE_PATH`. Trailing slashes are enabled globally. Image optimization is disabled (`unoptimized: true`).
