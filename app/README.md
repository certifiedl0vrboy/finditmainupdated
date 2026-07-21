# FindIt Kenya

A service-provider marketplace connecting Kenyan customers with local professionals and
businesses — plumbers, electricians, tailors, salons, restaurants, and 50+ other categories.

## Tech stack

- React 19 + Vite 7 + TypeScript
- Tailwind CSS + shadcn/ui components
- Supabase (Postgres, Auth, Storage, Realtime)
- Paystack for subscription payments
- Capacitor for native Android & iOS builds
- Leaflet + OpenStreetMap for maps and live provider tracking

## Getting started

1. Copy `.env.example` to `.env` and fill in your own Supabase and Paystack credentials:
   ```
   cp .env.example .env
   ```
2. Install dependencies:
   ```
   npm install
   ```
3. Run the dev server:
   ```
   npm run dev
   ```

## Environment variables

| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon/public key (safe for client-side use) |
| `VITE_PAYSTACK_PUBLIC_KEY` | Paystack public key (use `pk_test_...` for local dev) |
| `VITE_ENFORCE_SUBSCRIPTION` | Set to `false` to temporarily disable trial/subscription gating platform-wide. Defaults to enforced (`true`). |

**Never commit `.env`.** It's already git-ignored. Admin scripts under `scripts/` that need
elevated database access read `SUPABASE_SERVICE_ROLE_KEY` from the environment at run time —
that key must never be hardcoded in source. See `scripts/admin_clear_data.ts` for details and
usage.

## Native app builds (Android / iOS)

This project uses [Capacitor](https://capacitorjs.com) to wrap the web app for native
distribution.

```
npm run build
npx cap sync
npx cap open android   # opens the project in Android Studio
npx cap open ios       # opens the project in Xcode (macOS only)
```

Both `android/` and `ios/` are full native projects checked into this repo. If you change the
app name, icon, or splash screen, update `capacitor.config.ts` and run `npx cap sync` again to
propagate the change into both native projects.

## Live provider tracking

FindIt supports Uber-style live tracking: once a provider accepts a job, their location streams
to the customer in real time via Supabase Realtime, with a route line and ETA rendered using
Leaflet + OpenStreetMap (via the free OSRM public routing API — no API key required). See
`src/components/LiveTrackingMap.tsx` and `src/hooks/useLiveLocationBroadcast.ts`.

## Project structure

```
src/
 ├─ pages/            Route-level pages (Landing, Login, Register, Search, Profile, Dashboard, Saved)
 ├─ components/        Shared components + shadcn/ui primitives in components/ui/
 ├─ lib/               supabase.ts, categories.ts, backgroundImages.ts, utils.ts
 └─ hooks/             Custom hooks (geolocation, live tracking, mobile detection)
scripts/               One-off admin/debug scripts — see header comments before running any of these
supabase/migrations/   SQL migrations to run in the Supabase SQL editor
```

## Linting

```
npm run lint
```

## Admin scripts

Scripts under `scripts/` are for local development and debugging only — they are not part of
the shipped application. Read the header comment in each file before running it; some (like
`admin_clear_data.ts`) are destructive and require explicit confirmation.
