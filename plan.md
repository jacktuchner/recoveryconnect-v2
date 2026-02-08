# RecoveryConnect — Project Plan

## Overview

RecoveryConnect is a peer-to-peer surgical recovery support platform connecting patients with recovery mentors (contributors) who've been through similar procedures. Built with Next.js 16, TypeScript, Supabase, and Stripe.

---

## Current Status: Late-Stage Development

The core platform is built and functional. Most features are implemented. The build is clean with zero TypeScript/lint errors.

---

## Architecture

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16 (App Router), React 19, TailwindCSS 4 |
| Backend | Next.js API Routes (58 endpoints) |
| Database | Supabase (PostgreSQL), Prisma (schema only) |
| Auth | NextAuth.js v4 (credentials provider, JWT strategy) |
| Payments | Stripe (Checkout, Subscriptions, Connect for payouts) |
| Email | Resend |
| Video Calls | Daily.co |
| File Storage | AWS S3 |
| Transcription | OpenAI Whisper |
| Deployment | Vercel |

---

## User Roles

| Role | Description |
|------|------------|
| **PATIENT** | Browse content, purchase recordings, book calls, join group sessions |
| **CONTRIBUTOR** | Create recordings, set availability, earn money, host group sessions |
| **BOTH** | Full patient + contributor access |
| **ADMIN** | Platform moderation, user management, content review |

---

## Feature Map

### Tier 1: Recorded Content (Implemented)
- [x] Recording upload (audio/video to S3)
- [x] Recording workflow (DRAFT → PENDING_REVIEW → PUBLISHED → REJECTED)
- [x] 6 recording categories (Weekly Timeline, Wish I Knew, Practical Tips, Mental Health, Return to Activity, Mistakes & Lessons)
- [x] FAQ prompt selector for structured content
- [x] Recording series (bundles with discount pricing)
- [x] Transcription via OpenAI Whisper
- [x] Subscriber view tracking for payout distribution
- [x] Individual purchase via Stripe Checkout
- [x] Access control (subscription vs individual purchase)

### Tier 2: Live 1-on-1 Calls (Implemented)
- [x] Contributor availability management (day/time slots, timezone)
- [x] Call booking workflow (REQUESTED → CONFIRMED → COMPLETED/CANCELLED/NO_SHOW)
- [x] 30/60 minute session options
- [x] Pre-call question submission
- [x] Daily.co video integration
- [x] Platform takes 25% fee, contributor gets 75%
- [x] Call reminders (day-before, hour-before via cron)

### Tier 3: Group Sessions (Implemented)
- [x] Contributor-created group sessions
- [x] Min/max capacity (4–20 attendees, min threshold default: 3)
- [x] Free for subscribers option
- [x] Lifecycle management (SCHEDULED → CONFIRMED → COMPLETED/CANCELLED)
- [x] Auto-cancel if minimum not met (4 hours before start)
- [x] Refund handling

### Tier 4: Recommendations (Implemented)
- [x] Product/provider recommendations by contributors
- [x] 7 categories (Recovery Product, PT Provider, Massage Therapy, Medical Provider, App/Tool, Book/Resource, Other)
- [x] Endorsement system (multi-contributor)
- [x] Voting/helpful system
- [x] Comments
- [x] Subscriber-only access

### Matching System (Implemented)
- [x] Multi-factor matching algorithm
- [x] Scores based on: procedure type, details, age range, activity level, recovery goals, complicating factors, lifestyle context
- [x] Match scores displayed on recordings & contributor cards

### Subscriptions & Payments (Implemented)
- [x] Monthly plan ($19.99) and Annual plan ($149.99)
- [x] Stripe Checkout + Customer Portal
- [x] Stripe Connect for contributor payouts
- [x] Payment tracking across all purchase types
- [x] Earnings dashboard for contributors

### Authentication (Implemented)
- [x] Email/password registration with role selection
- [x] Password reset flow (email via Resend)
- [x] JWT sessions with role + subscription status
- [x] Protected routes (dashboards, API)

### Admin Tools (Implemented)
- [x] Stats dashboard (pending recordings, users, reports, calls)
- [x] Recording review/approval
- [x] User management (roles, suspension)
- [x] Report handling (PENDING → REVIEWED → ACTION_TAKEN → DISMISSED)
- [x] Payment overview

### Email Notifications (Implemented)
- [x] Welcome emails
- [x] Call booking, confirmation, cancellation
- [x] Group session lifecycle emails
- [x] Subscription confirmation/cancellation
- [x] Password reset
- [x] Call reminders

---

## Supported Procedures

ACL Reconstruction, Total Hip Replacement, Total Knee Replacement, Total Shoulder Replacement, Spinal Fusion, Laminectomy, Rotator Cuff Repair, Meniscus Repair, Shoulder Labrum Repair, Ankle Reconstruction, Carpal Tunnel Release, Hernia Repair, Gallbladder Removal, Hysterectomy

---

## Pricing & Business Rules

| Item | Price |
|------|-------|
| Individual recording | $4.99+ (contributor sets) |
| Monthly subscription | $19.99 |
| Annual subscription | $149.99 |
| Call rates | $40–$75/hour (contributor sets) |
| Group sessions | $10–$35/person (contributor sets) |
| Platform fee | 25% on all contributor earnings |
| Contributor payout | 75% |

---

## Pages & Routes

### Public
- `/` — Homepage
- `/about` — About page
- `/how-it-works` — Patient/Contributor explainer + pricing
- `/contact` — Contact page
- `/privacy`, `/terms` — Legal

### Auth
- `/auth/signin` — Login
- `/auth/register` — Registration (role selection)
- `/auth/forgot-password` — Password reset request
- `/auth/reset-password` — Reset form

### Patient
- `/watch` — Browse recordings (filters, search, sorting, match scores)
- `/recordings/[id]` — Recording detail
- `/series/[id]` — Series detail
- `/mentors` — Browse contributors for calls
- `/contributors/[id]` — Contributor profile
- `/book/[contributorId]` — Book a call
- `/group-sessions` — Browse group sessions
- `/group-sessions/[id]` — Session detail + registration
- `/recommendations` — Browse recommendations (subscriber-only)
- `/recommendations/[id]` — Recommendation detail
- `/dashboard/patient` — Patient dashboard

### Contributor
- `/dashboard/contributor` — Contributor dashboard (recordings, series, calls, earnings, group sessions, recommendations, Stripe Connect)

### Admin
- `/admin` — Stats overview
- `/admin/recordings` — Review recordings
- `/admin/users` — Manage users
- `/admin/reports` — Handle reports
- `/admin/payments` — Payment history

### Checkout
- `/checkout/success` — Post-purchase success
- `/checkout/cancel` — Purchase cancellation

---

## Environment Variables

```
DATABASE_URL
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
NEXTAUTH_SECRET
NEXTAUTH_URL
STRIPE_SECRET_KEY
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
STRIPE_WEBHOOK_SECRET
STRIPE_MONTHLY_PRICE_ID
STRIPE_ANNUAL_PRICE_ID
S3_BUCKET
S3_REGION
S3_ACCESS_KEY
S3_SECRET_KEY
OPENAI_API_KEY
RESEND_API_KEY
NEXT_PUBLIC_APP_URL
CRON_SECRET
DAILY_API_KEY
```

---

### Reviews System (Implemented)
- [x] GET /api/reviews with filters (authorId, subjectId, recordingId, callId) + privacy-aware author info
- [x] POST /api/reviews with duplicate review prevention (one review per call/recording per user)
- [x] PATCH /api/reviews/[id] — author-only editing (rating, matchRelevance, helpfulness, comment)
- [x] DELETE /api/reviews/[id] — author or admin deletion
- [x] CallReviewForm component — reusable star-input form for create and edit modes
- [x] Patient dashboard: "Leave a Review" on completed calls (inline CallReviewForm)
- [x] Patient dashboard: "Pending Reviews" banner (up to 3 unreviewed completed calls)
- [x] Patient dashboard: "My Reviews" section with edit/delete
- [x] Contributor dashboard: "Avg Rating" and "Total Reviews" stat cards
- [x] Contributor dashboard: "Reviews Received" section (10 most recent)
- [x] Contributor profile: call + recording reviews merged, sorted by date, with type badges
- [x] ReportButton extended with reviewId prop for reporting reviews
- [x] Reports API supports reviewId in create and fetch
- [x] Admin reports page: review type filter, review context display, "Delete Review" action

---

## What's Next — Potential Enhancements

These are **not yet built** but are natural next steps:

1. **Full-text search** — Search across recording transcriptions for deeper content discovery.
2. **Contributor analytics** — Detailed earnings breakdowns, view trends, engagement metrics.
3. **AI-powered recommendations** — Suggest recordings/contributors based on user profile and behavior.
4. **Direct messaging** — Chat between patients and contributors.
5. **Mobile app** — Currently web-only.
6. **Content moderation AI** — Automated content filtering beyond manual admin review.
7. **Recovery journal/tracking** — Let patients log recovery milestones and progress.

---

## Dev Workflow

1. Make changes
2. Run `npm run build` to catch TypeScript/lint errors
3. Test locally with `npm run dev`
4. Use `/deploy` skill to push to Vercel
5. Use `/pre-fix` skill to investigate bugs across all layers before writing code
