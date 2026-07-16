# Performance Matrix Dashboard

A web-based program dashboard for tracking project progress, resource allocation, and budget, with role-based access control (Admin / User).

## Stack

- **Next.js 16** (App Router) + TypeScript + Tailwind CSS
- **shadcn/ui** (Base UI) component library
- **Prisma** ORM against a **Supabase Postgres** database (provisioned via the Vercel Marketplace)
- **NextAuth (Auth.js v5)** with a Credentials provider — email/password login, JWT sessions, role stored on the user record
- **Recharts** for data visualization

## Getting Started

```bash
npm install
npx prisma generate
npm run dev
```

The `.env.local` file (already provisioned via `vercel env pull`) contains the Supabase connection strings and `AUTH_SECRET`.

Open [http://localhost:3000](http://localhost:3000).

## Demo accounts

| Role  | Email               | Password    |
|-------|---------------------|-------------|
| Admin | admin@example.com   | Admin123!   |
| User  | user@example.com    | User123!    |

Re-seed demo data at any time with:

```bash
npx prisma db seed
```

## Roles

- **Admin** — full access: create/edit/delete projects, assign resources, record budget entries, manage users and roles.
- **User** — read-only access to the program overview, project list/detail, and resource allocation matrix.

## Data model

- `Project` — name, code, status, priority, progress %, budget total, manager, dates
- `Milestone` — per-project checkpoints
- `ResourceAllocation` — links a `User` to a `Project` with an allocation percentage and role
- `BudgetEntry` — allocated or actual-expense line items per project, by category
- `User` — name, email, password hash, role (`ADMIN` / `USER`), title, weekly capacity

## Key pages

- `/dashboard` — program overview: KPIs, status breakdown, budget and progress charts
- `/dashboard/projects` — project list and detail pages (progress, milestones, allocations, budget)
- `/dashboard/resources` — team utilization matrix across active projects
- `/dashboard/admin/users` — user management and role assignment (Admin only)
# performance-dashboard
