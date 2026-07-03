Veyra — Backend README

Prerequisites
- Node.js 20+
- npm
- A Postgres database (Supabase recommended)

Quick setup
1. Copy `.env.example` to `.env.local` and fill `DATABASE_URL` and `SUPABASE_URL`/`SUPABASE_KEY`.

2. Install deps:

```bash
npm install
```

3. Generate and apply migrations from the repo root:

```bash
npm run db:generate
npm run db:migrate
```

4. Run dev server:

```bash
npm run dev
```

Notes
- RLS policies are included in the initial migration; verify Supabase settings if using Supabase.
- Keep `.env.local` out of the repo.
