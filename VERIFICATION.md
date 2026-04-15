# ✅ Habbit Tracker — Verification Guide

## Build Verification

### Commands
```bash
npm run build          # Must complete with zero errors
npm run lint           # Must pass with zero warnings (or only non-critical)
npm run dev            # Must start dev server without crashes
```

### TypeScript
- Strict mode enabled
- No `any` types in production code (allowed in test/scratch files)
- All Firebase data types explicitly typed

## Browser Testing Checklist

### Viewports to Test
| Device | Width | Height | Priority |
|--------|-------|--------|----------|
| iPhone SE | 375px | 667px | P0 |
| iPhone 12 Pro | 390px | 844px | P0 |
| iPad | 768px | 1024px | P1 |
| Desktop | 1024px | 768px | P1 |
| Desktop (wide) | 1440px | 900px | P2 |

### Authentication Flows
- [ ] Sign up with email + password
- [ ] Sign in with existing account
- [ ] Sign in with Google OAuth
- [ ] Sign out
- [ ] Redirect to /login when unauthenticated
- [ ] Redirect to /dashboard when authenticated
- [ ] Display user name and avatar after login

### Habit Management
- [ ] Create a new habit (positive type)
- [ ] Create a new habit (negative type)
- [ ] Toggle habit: pending → completed (green)
- [ ] Toggle habit: completed → failed (red)
- [ ] Toggle habit: failed → pending (neutral)
- [ ] Edit existing habit (name, emoji, category)
- [ ] Delete a habit (with confirmation)
- [ ] Verify max 10 habits limit
- [ ] Verify habits persist on page reload
- [ ] Verify habit state persists for today

### Tree Gamification
- [ ] Tree renders on dashboard
- [ ] Tree reflects current health score
- [ ] Flourishing state (80-100): full canopy, butterflies, flowers, glow
- [ ] Healthy state (60-79): good foliage, some flowers
- [ ] Growing state (40-59): sparse leaves, sapling
- [ ] Struggling state (20-39): yellowing, bugs, bare branches
- [ ] Dying state (0-19): bare, insects, dark, rotten fruit
- [ ] Canvas animation runs at 60fps
- [ ] CSS glow effect matches health state (green ↔ red)

### Analytics
- [ ] Weekly completion ring renders
- [ ] Monthly bar chart renders with data
- [ ] Streak card shows correct current streak
- [ ] Good vs bad ratio chart renders
- [ ] "View More" expands on trend cards
- [ ] Charts are responsive on mobile

### Shareable Profile
- [ ] Toggle sharing on/off in settings
- [ ] Copy shareable link works
- [ ] Profile page loads in incognito (no auth required)
- [ ] Profile shows read-only habit data + tree + stats
- [ ] Profile page has proper SEO meta tags

### Navigation & UI
- [ ] Bottom nav shows on all authenticated pages
- [ ] Active nav item has visual indicator
- [ ] Header displays correct date and streak
- [ ] Landing page shows for unauthenticated users
- [ ] All animations are smooth (no jank)
- [ ] All cards have hover/active states on desktop
- [ ] No horizontal scroll on any viewport
- [ ] Text is readable at all sizes

## Performance Targets

| Metric | Target | Tool |
|--------|--------|------|
| First Contentful Paint | < 1.5s | Lighthouse |
| Largest Contentful Paint | < 2.5s | Lighthouse |
| Time to Interactive | < 3.5s | Lighthouse |
| Canvas FPS | 60fps steady | Chrome DevTools |
| Bundle size (JS) | < 200KB gzipped | `npm run build` output |
| Lighthouse Performance | > 90 | Lighthouse |

## Git Workflow

### Initial Commit
```bash
git init
git add .
git commit -m "feat: initial habit tracker with gamification

- Next.js 15 App Router with TypeScript
- Firebase Auth (email + Google OAuth)
- Firebase Firestore for data persistence
- Vintage paper design system (Newsreader + Inter)
- HTML5 Canvas tree gamification (5 health states)
- Chart.js analytics (weekly/monthly/streaks)
- Shareable public profiles (SSR)
- Mobile-first responsive design
- CSS-only visual effects (glow, patterns, animations)"
```

### Branch Strategy (Future)
- `main` — production, auto-deploys to Vercel
- `dev` — development branch
- `feature/*` — feature branches

### .gitignore Must Include
```
node_modules/
.next/
.env.local
.env*.local
*.tsbuildinfo
```

## Environment Variables

### Required in `.env.local`
```
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

### Vercel Dashboard
All above variables must be added to: **Vercel → Project Settings → Environment Variables**
