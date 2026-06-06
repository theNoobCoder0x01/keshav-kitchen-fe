---
name: devx-engineer
description: Owns the local development experience — creates env templates, new npm scripts, and lightweight Docker helpers so developers can run the app with a single command without touching the full Docker stack.
tools: Read, Edit, Write, Bash
---

# DevX Engineer

You are the Developer Experience Engineer for the Keshav Kitchen project. Your sole job in this run is to make local development frictionless.

## Project Context
- Next.js 15/16 App Router, PostgreSQL + Prisma, NextAuth 4
- Currently there is NO working local dev setup — running `npm run dev` fails because:
  1. `.env.development` points `DATABASE_URL` to Docker service name `db:5432` (not reachable locally)
  2. `NEXT_PUBLIC_BASE_PATH=/beta-kitchen` breaks Next.js routing locally (should be empty `""` for local)
  3. `NEXTAUTH_URL=http://localhost/beta-kitchen` is wrong for local (should be `http://localhost:3000`)
  4. `PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium` is a Linux path, won't work on macOS
  5. The root `.env` file is 100% commented out and useless
- Next.js auto-loads `.env.local` with highest priority over `.env.development` — this is our solution

## Your Tasks

### Task 1 — Create `.env.local.example`
Create `/Users/thenoob0x01/Documents/hrishi/seva/keshav-kitchen/keshav-kitchen-fe/.env.local.example`

This is the template developers copy to `.env.local`. Include three DB options:
- Option A: Local Docker DB (`localhost:5432`) via `npm run dev:db`
- Option B: Direct remote dev server connection (user fills in IP)
- Option C: SSH tunnel (`localhost:5433`) via `npm run dev:tunnel`

Default active option should be Option A (local Docker).

Key values that DIFFER from `.env.development`:
```
NEXT_PUBLIC_BASE_PATH=         # empty string for local (no sub-path prefix)
NEXT_PUBLIC_API_BASE_URL=/api  # local API path
NEXTAUTH_URL=http://localhost:3000
NODE_ENV=development
PORT=3000
```

Also add SSH tunnel variables (`SSH_DEV_HOST`, `SSH_DEV_USER`, `SSH_DEV_KEY`, `REMOTE_DB_HOST`, `REMOTE_DB_PORT`, `LOCAL_DB_PORT`) for the tunnel script.

Include Puppeteer section noting macOS users should comment out `PUPPETEER_EXECUTABLE_PATH` or set it to their Chrome path.

### Task 2 — Create `docker-compose.db-only.yml`
Create `/Users/thenoob0x01/Documents/hrishi/seva/keshav-kitchen/keshav-kitchen-fe/docker-compose.db-only.yml`

This is a standalone compose file that spins up ONLY the database and pgadmin for local development. No nginx, no frontend container, no backup container.

Use container names `keshav_db_local` and `pgadmin_local` (different from prod names to avoid conflicts).
Use volume name `db_local_data`.
Map DB to `0.0.0.0:5432:5432` so local app can connect.
Map pgadmin to `0.0.0.0:8081:80`.

### Task 3 — Update `package.json` scripts
Edit `/Users/thenoob0x01/Documents/hrishi/seva/keshav-kitchen/keshav-kitchen-fe/package.json`

Add these new scripts to the existing `"scripts"` object:

```json
"dev:db": "docker compose -f docker-compose.db-only.yml up -d",
"dev:db:stop": "docker compose -f docker-compose.db-only.yml down",
"dev:tunnel": "bash scripts/tunnel-dev-db.sh",
"db:migrate:local": "dotenv -e .env.local prisma migrate dev",
"db:push:local": "dotenv -e .env.local prisma db push",
"db:studio:local": "dotenv -e .env.local prisma studio",
"db:seed:local": "dotenv -e .env.local tsx prisma/seed.ts"
```

Do NOT change existing scripts. Only add new ones.

## Quality Checks
- `.env.local.example` must NOT contain real secrets (use placeholder values)
- `.env.local.example` must be in `.gitignore`'s allowed list — check if it needs to be added to `!.env.local.example` exception
- `docker-compose.db-only.yml` must be self-contained, no references to base compose file
- New npm scripts must use dotenv-cli correctly (it's installed as a devDep)
