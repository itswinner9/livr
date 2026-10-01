# LivRank

Canada-first rental-property intelligence. **Know the place before you rent it.**

Reviews, rent reports, and AI answers are **renter-reported / LivRank-calculated** unless another source is labeled. This product does not claim official rental history or guaranteed accuracy.

## Run locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

Without Supabase keys, the site still runs using **labeled fictional demo properties** (including 123 Main Street, Surrey). Demo copy is not real renter data.

## Required environment

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server-only; admin/moderation)

## Optional

- **AI:** `OPENROUTER_API_KEY` plus optional model overrides
- **Stripe:** `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, price IDs
- **Email:** `RESEND_API_KEY`
- **Address geocoding:** `ADDRESS_PROVIDER_API_KEY`

## Supabase

1. Create a project.
2. Run [`supabase/migrations/20240926000000_init.sql`](supabase/migrations/20240926000000_init.sql) (PostGIS, pgvector, RLS).
3. Apply [`supabase/seed/seed.sql`](supabase/seed/seed.sql) in development only.
4. Promote a profile to `admin` in SQL after signup:

```sql
update public.profiles set role = 'admin' where id = '<auth user uuid>';
```

## Scripts

```bash
npm run dev
npm run lint
npm run typecheck
npm run test
npm run build
```

Core loop: search → property → reviews / rent history / topics → Ask LivRank → submit review (pending) → admin approve → public rating updates.
