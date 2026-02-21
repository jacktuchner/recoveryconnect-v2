# Kizu — Project Plan

## Overview

Kizu is a peer-to-peer surgical recovery support platform connecting seekers with recovery guides who've been through similar procedures. Built with Next.js 16, TypeScript, Supabase, and Stripe.

---

## Current Status: Pre-Launch

The core platform is built and functional. All planned features are implemented. Build is clean with zero TypeScript/lint errors. Rebranded from PeerHeal → Kizu (Feb 2026). Domain: thekizu.com.

---

## Architecture

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16 (App Router), React 19, TailwindCSS 4 |
| Backend | Next.js API Routes (68 endpoints) |
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
| **SEEKER** | Browse content, purchase recordings, book calls, join group sessions |
| **GUIDE** | Create recordings, set availability, earn money, host group sessions |
| **BOTH** | Full seeker + guide access |
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
- [x] Guide availability management (day/time slots, timezone)
- [x] Call booking workflow (REQUESTED → CONFIRMED → COMPLETED/CANCELLED/NO_SHOW)
- [x] 30/60 minute session options
- [x] Pre-call question submission
- [x] Daily.co video integration
- [x] Platform takes 25% fee, guide gets 75%
- [x] Call reminders (day-before, hour-before via cron)

### Tier 3: Group Sessions (Implemented)
- [x] Guide-created group sessions
- [x] Min/max capacity (4–20 attendees, min threshold default: 3)
- [x] Free for subscribers option
- [x] Lifecycle management (SCHEDULED → CONFIRMED → COMPLETED/CANCELLED)
- [x] Auto-cancel if minimum not met (4 hours before start)
- [x] Refund handling

### Tier 4: Recommendations (Implemented)
- [x] Product/provider recommendations by guides
- [x] 7 categories (Recovery Product, PT Provider, Massage Therapy, Medical Provider, App/Tool, Book/Resource, Other)
- [x] Endorsement system (multi-guide)
- [x] Voting/helpful system
- [x] Comments
- [x] Subscriber-only access

### Tier 5: Direct Messaging (Implemented)
- [x] Conversation model (unique per user pair, lastMessageAt tracking)
- [x] Message model (text, read receipts)
- [x] Create/find conversations (POST /api/conversations)
- [x] List conversations with last message preview + unread count (GET /api/conversations)
- [x] Fetch messages + mark as read (GET /api/conversations/[id])
- [x] Send messages (POST /api/messages)
- [x] Unread count endpoint for navbar badge (GET /api/messages/unread)
- [x] Subscriber-only for seekers, guides reply free
- [x] MessageButton on guide profiles
- [x] Messages link + unread badge in navbar (polls every 15s)
- [x] Chat UI with polling (3s), auto-scroll, read receipts
- [x] Throttled email notifications (skip if last message <10 min ago)
- [x] Privacy-aware display names throughout

### Matching System (Implemented)
- [x] Multi-factor matching algorithm
- [x] Scores based on: procedure type, details, age range, activity level, recovery goals, complicating factors, lifestyle context
- [x] Match scores displayed on recordings & guide cards

### Subscriptions & Payments (Implemented)
- [x] Monthly plan ($19.99) and Annual plan ($149.99)
- [x] Stripe Checkout + Customer Portal
- [x] Stripe Connect for guide payouts
- [x] Payment tracking across all purchase types
- [x] Earnings dashboard for guides

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
- [x] New message notifications (throttled)

---

## Supported Procedures

ACL Reconstruction, Total Hip Replacement, Total Knee Replacement, Total Shoulder Replacement, Spinal Fusion, Laminectomy, Rotator Cuff Repair, Meniscus Repair, Shoulder Labrum Repair, Ankle Reconstruction, Carpal Tunnel Release, Hernia Repair, Gallbladder Removal, Hysterectomy

---

## Pricing & Business Rules

| Item | Price |
|------|-------|
| Individual recording | $4.99+ (guide sets) |
| Monthly subscription | $19.99 |
| Annual subscription | $149.99 |
| Call rates | $40–$75/hour (guide sets) |
| Group sessions | $10–$35/person (guide sets) |
| Platform fee | 25% on all guide earnings |
| Guide payout | 75% |

---

## Pages & Routes

### Public
- `/` — Homepage
- `/about` — About page
- `/how-it-works` — Seeker/Guide explainer + pricing
- `/contact` — Contact page
- `/privacy`, `/terms` — Legal

### Auth
- `/auth/signin` — Login
- `/auth/register` — Registration (role selection)
- `/auth/forgot-password` — Password reset request
- `/auth/reset-password` — Reset form

### Seeker
- `/watch` — Browse recordings (filters, search, sorting, match scores)
- `/recordings/[id]` — Recording detail
- `/series/[id]` — Series detail
- `/guides` — Browse guides for calls
- `/guides/[id]` — Guide profile
- `/book/[guideId]` — Book a call
- `/group-sessions` — Browse group sessions
- `/group-sessions/[id]` — Session detail + registration
- `/recommendations` — Browse recommendations (subscriber-only)
- `/recommendations/[id]` — Recommendation detail
- `/dashboard/seeker` — Seeker dashboard (tabbed layout)
- `/dashboard/seeker/settings` — Settings (privacy, subscription, journal sharing, become a guide)
- `/messages` — Conversations list
- `/messages/[conversationId]` — Chat view

### Guide
- `/dashboard/guide` — Overview (stats, call requests, shared seeker journals, payout history, reviews received)
- `/dashboard/guide/content` — Content management (recordings, series, group sessions, recommendations)
- `/dashboard/guide/profile` — Profile editing (procedures, shared profile, bio & intro video)
- `/dashboard/guide/analytics` — Earnings & engagement analytics
- `/dashboard/guide/settings` — Settings (availability, payout settings, privacy settings, upgrade to seeker access)

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
- [x] Seeker dashboard: "Leave a Review" on completed calls (inline CallReviewForm)
- [x] Seeker dashboard: "Pending Reviews" banner (up to 3 unreviewed completed calls)
- [x] Seeker dashboard: "My Reviews" section with edit/delete
- [x] Guide dashboard: "Avg Rating" and "Total Reviews" stat cards
- [x] Guide dashboard: "Reviews Received" section (10 most recent)
- [x] Guide profile: call + recording reviews merged, sorted by date, with type badges
- [x] ReportButton extended with reviewId prop for reporting reviews
- [x] Reports API supports reviewId in create and fetch
- [x] Admin reports page: review type filter, review context display, "Delete Review" action

### Guide Dashboard Tabs (Implemented)
- [x] Shared layout with tab bar (Overview, Content, Profile, Analytics, Settings)
- [x] Each tab fetches only its own data (no wasted API calls)
- [x] Overview: stats cards, call requests, shared seeker journals, payout history, reviews received
- [x] Content: recordings, series, group sessions, recommendations
- [x] Profile: procedures, shared profile, bio & intro video, "View Public Profile" button
- [x] Analytics: full earnings & engagement analytics (dedicated page)
- [x] Settings: availability manager, payout settings, privacy settings, upgrade to seeker access
- [x] Public profile back link is context-aware (dashboard vs browse)

### Recovery Journal (Implemented)
- [x] Daily journal entries with pain level (1-10), mobility level (1-10), mood (1-5), notes, milestones
- [x] Per-procedure tracking with recovery week calculation from surgery date
- [x] Share toggle per entry (isShared flag)
- [x] Per-guide journal sharing — seekers grant access to specific guides via JournalShare table
- [x] Journal sharing manager in seeker Settings (toggle switches per eligible guide)
- [x] In-journal hint linking to Settings when share toggle is enabled
- [x] Shared seeker journals section on guide Overview (expandable per seeker, shows entries)
- [x] API: GET/POST/DELETE `/api/journal/shares` (seeker manages shares)
- [x] API: GET `/api/journal/shares/received` (guide sees who shared with them)
- [x] API: GET `/api/journal/shared/[patientId]` (guide views entries, requires explicit share grant)

### Seeker Dashboard Tabs (Implemented)
- [x] Shared layout with tab bar (Dashboard, Settings)
- [x] Dashboard: subscription banners, procedures, profile, purchase history, journal, calls, reviews
- [x] Settings: privacy settings, subscription management, journal sharing controls, become a guide CTA
- [x] Subscription portal redirects back to settings page

### Navigation (Implemented)
- [x] Guide dropdown: Overview, Content, Profile, Analytics, Settings
- [x] Seeker dropdown: Dashboard, Watch Stories, Find a Guide, Group Sessions, Recommendations, Settings
- [x] BOTH/ADMIN: both dropdowns side by side
- [x] GUIDE-only and SEEKER-only: single dropdown (consistent pattern)
- [x] Logged-out: "Browse" dropdown
- [x] Mobile menu: section headers with indented links for all roles
- [x] Messages link with unread badge (top-level, cross-cutting)

---

## Launch Checklist

### Infrastructure (Do First)
- [ ] Deploy latest code to Vercel (rebrand commit)
- [ ] Verify `thekizu.com` domain is live and SSL works
- [ ] Verify Resend email sending from `support@thekizu.com`
- [ ] Test Stripe checkout flow end-to-end (recording purchase, subscription, call booking)
- [ ] Test Stripe Connect onboarding for a guide
- [ ] Verify Daily.co video calls work in production
- [ ] Verify S3 uploads work (recording upload flow)
- [ ] Test cron jobs are running (call reminders, group session lifecycle)
- [ ] Update `NEXT_PUBLIC_APP_URL` env var to `https://thekizu.com`

### Content & Data
- [ ] Create your own guide profile (first guide on the platform)
- [ ] Upload 2-3 seed recordings so the platform isn't empty at launch
- [ ] Test the full seeker flow: register → profile wizard → browse → purchase → watch

### Payments
- [ ] Switch Stripe from test mode to live mode
- [ ] Update Stripe API keys in Vercel env vars (live keys)
- [ ] Update Stripe webhook endpoint to `https://thekizu.com/api/webhooks/stripe`
- [ ] Create live Stripe price IDs for monthly/annual subscriptions
- [ ] Update `STRIPE_MONTHLY_PRICE_ID` and `STRIPE_ANNUAL_PRICE_ID` env vars

### SEO & Analytics
- [ ] Add Google Analytics or Vercel Analytics
- [ ] Add Open Graph meta tags (image, description) for social sharing
- [ ] Submit sitemap to Google Search Console
- [ ] Add favicon/app icon with Kizu branding

### Legal
- [ ] Review Terms of Service one more time (all references say Kizu)
- [ ] Review Privacy Policy one more time
- [ ] Consider adding a cookie consent banner if targeting EU users

---

## Post-Launch Enhancements

These are **not yet built** but are natural next steps:

1. **Full-text search + transcriptions** — The transcription pipeline (OpenAI Whisper) is already built but not active — needs an API key (~$0.006/min, very cheap). Once activated: transcribe all recordings, display transcripts on recording pages for accessibility, build a search UI so seekers can search by what guides actually say (e.g. "knee pain at night"), and wire up the existing content moderation flags to the admin dashboard.
2. **AI-powered recommendations** — Suggest recordings/guides based on user profile and behavior.
3. **Mobile app (Capacitor)** — Wrap existing Next.js app in native iOS/Android shell via Capacitor. Get app store presence, push notifications, and native feel with minimal code changes.
4. **Content moderation AI** — Automated content filtering beyond manual admin review.
5. **Social proof** — Testimonials, user count badges, "X people watched this" indicators.
6. **Email marketing** — Drip campaigns for new users, re-engagement for inactive users.
---

## Dev Workflow

1. Make changes
2. Run `npm run build` to catch TypeScript/lint errors
3. Test locally with `npm run dev`
4. Use `/deploy` skill to push to Vercel
5. Use `/pre-fix` skill to investigate bugs across all layers before writing code
