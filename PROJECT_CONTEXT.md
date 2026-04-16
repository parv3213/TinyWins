# 🌳 TinyWins — Project Context

> A passion project. Free to host, beautiful to use, emotionally engaging.

## Purpose & Ideology

This is a **minimalist habit tracker with gamification** that makes building good habits feel rewarding without guilt — your virtual tree reflects your daily choices.

**Core philosophy:**
- **Emotional engagement over data overload** — The tree is the star, not spreadsheets
- **Friction-free daily use** — 1-2 taps per habit, under 30 seconds total
- **Visual honesty** — Your tree can't lie. It shows exactly how you're doing
- **Shareable progress** — Public profiles let accountability partners check in
- **Zero cost** — Fully hosted on free tiers (Vercel + Firebase Spark)

## Feature Priorities

| Priority | Feature | Status |
|----------|---------|--------|
| P0 | Daily habit checklist (create, toggle, track) | ✅ Completed |
| P0 | User authentication (email + Google OAuth) | ✅ Completed |
| P0 | Tree gamification (Canvas, 5 health states) | ✅ Completed |
| P1 | Analytics & trends (weekly/monthly charts) | ✅ Completed |
| P1 | Shareable public profile | ✅ Completed |
| P2 | PWA / push notifications | ⏳ Future |
| P2 | Habit categories & tags | ⏳ Future |
| P2 | Social features (friends, leaderboards) | ⏳ Future |

## Tech Stack Rationale

| Technology | Why This One |
|------------|-------------|
| **Next.js 15 (App Router)** | SSR for public profiles (SEO), file-based routing, Vercel-native |
| **Firebase Auth** | 10K MAU free on Spark plan, email + Google OAuth out-of-box |
| **Firebase Firestore** | 1GB storage + 50K reads/day free, real-time listeners, offline persistence |
| **Vanilla CSS (CSS Modules)** | Zero runtime cost, full design control, no Tailwind dependency |
| **HTML5 Canvas** | Best performance for procedural tree animation + particles |
| **Chart.js** | Lightweight (< 60KB gzipped), Apple Fitness-style charts |
| **Google Fonts (Newsreader + Inter)** | Free, vintage serif + modern sans-serif pairing |
| **Vercel (Hobby)** | Free hosting, auto-deploy from GitHub, edge CDN, zero config |

## User Interaction Flows

### Daily Flow (Primary — Target: < 30 seconds)
```
Open app → See tree + today's habits → Tap each habit to toggle → Done
```

### First-Time Flow
```
Landing page → Sign up (Google or email) → Create first habits (guided) → Dashboard
```

### Analytics Flow
```
Dashboard → Tap "Analytics" in bottom nav → View weekly/monthly trends → Tap "View More" on any card
```

### Sharing Flow
```
Settings → Enable sharing → Copy profile link → Share with friend → Friend views read-only profile
```

## Key Constraints
- **Max 10 habits per user** — Forces focus, prevents overwhelm
- **Today-only logging** — No backfilling past days (keeps it honest)
- **Mobile-first** — Designed for 375px+ screens, scales up to desktop
- **No backend server** — Everything runs on Firebase (serverless)
- **No paid dependencies** — Every package must be free and open-source

## Deployment

- **Platform**: Vercel (Hobby tier — free)
- **Domain**: Auto-assigned `.vercel.app` subdomain (custom domain optional)
- **CI/CD**: Push to `main` branch auto-deploys
- **Environment Variables**: Firebase config stored in Vercel project settings
- **Region**: Auto (Vercel edge)

## Repository Structure
```
/                       Project root
├── PROJECT_CONTEXT.md  This file — project ideology & features
├── DESIGN_SYSTEM.md    Color palette, typography, visual effects
├── VERIFICATION.md     Testing checklist & verification guide
├── src/app/            Next.js App Router pages
├── src/components/     React components (UI, charts, tree)
├── src/contexts/       React contexts (auth)
└── src/lib/            Utilities (firebase, habits CRUD, analytics)
```
