# Nythia

Private tools platform with vouch-based registration and admin approval.

## Setup

```bash
npm install
cp .env.example .env   # edit AUTH_SECRET, ADMIN_USERNAME, ADMIN_PASSWORD
npx prisma db push
npm run db:seed
npm run dev
```

## Adding a new tool

Create `tools/<slug>/config.ts` and `tools/<slug>/Component.tsx`, then register in `src/lib/tools-meta.ts` and `src/lib/tools-registry.ts`.
