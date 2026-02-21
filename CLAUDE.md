# Kizu (formerly PeerHeal)

## Project Stack

This project (Kizu) is a Next.js app using TypeScript, Supabase (JS client, NOT Prisma), and Stripe for payments. The dev environment is Windows ARM64 (Snapdragon). Never suggest Prisma-based solutions or x64-specific binary fixes.

## Code Editing Rules

When editing files, always confirm the correct file path before making changes. This app has separate dashboards for different roles (seeker, guide, admin). Do NOT edit guide dashboard files when asked to change seeker dashboard files, and vice versa.

## Domain Logic / Business Rules

This app has multi-procedure support. Guides can have multiple procedures; all should be visible and filterable. The 'set as main procedure' feature is guide-side, not viewer-side. Do not add viewer-side procedure tabs unless explicitly asked.

## Debugging Guidelines

When debugging, investigate the full stack (database schema, enum values, API layer, and frontend) before proposing a fix. Do not assume the issue is only in the frontend. Check for missing database columns, enum values, and RLS policies first.

## UI / Styling

After implementing UI changes, verify styling consistency with existing components. When adding indicators, badges, or markers, match the exact styling (font size, color, padding, border-radius) of adjacent similar elements.

## Deployment

Deployment target is Vercel. After making changes, run `npm run build` locally before suggesting deployment to catch TypeScript and lint errors early. Watch for unescaped quotes in JSX and ensure all environment variables are documented.
