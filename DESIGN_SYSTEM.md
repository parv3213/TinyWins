# 🎨 Habbit Tracker — Design System

> Vintage Paper aesthetic — warm sepia tones, serif headings, parchment cards, organic textures.

## Design Philosophy
- **Vintage warmth** over clinical minimalism
- **Organic textures** over flat solid colors
- **Serif elegance** for headings, sans-serif clarity for body
- **Nature-inspired** accents (forest green, earth brown, amber)
- **Emotionally responsive** — the UI subtly shifts with tree health

## Color Palette

### Base Colors (Vintage Paper)
```css
--bg: #f5f1e6;              /* Page background — warm parchment */
--fg: #4a3f35;              /* Primary text — dark brown */
--card: #fffcf5;            /* Card background — cream white */
--card-fg: #4a3f35;         /* Card text */
--primary: #a67c52;         /* Primary actions — warm brown */
--primary-fg: #ffffff;      /* Primary button text */
--secondary: #e2d8c3;       /* Secondary elements — tan */
--secondary-fg: #5c4d3f;    /* Secondary text */
--accent: #d4c8aa;          /* Accent — light khaki */
--muted: #ece5d8;           /* Muted backgrounds */
--muted-fg: #7d6b56;        /* Muted text */
--border: #dbd0ba;          /* Borders and dividers */
--input: #dbd0ba;           /* Input borders */
--ring: #a67c52;            /* Focus ring */
```

### Semantic Colors (Habit States)
```css
--success: #4a7c59;         /* Good habits ✅ — forest green */
--success-light: #e8f5e9;   /* Success tint background */
--success-glow: rgba(74, 124, 89, 0.3); /* Green glow */

--danger: #9c4b4b;          /* Bad habits ❌ — muted red */
--danger-light: #fbe9e7;    /* Danger tint background */
--danger-glow: rgba(156, 75, 75, 0.3);  /* Red glow */

--pending: #c4a882;         /* Pending state — amber */
--pending-light: #fef9ef;   /* Pending tint background */
```

### Tree Atmosphere Colors
```css
/* Healthy tree (score 80-100) */
--tree-sky-healthy: linear-gradient(180deg, #87CEEB 0%, #E0F7FA 100%);
--tree-ground-healthy: #4a7c59;
--tree-glow-healthy: rgba(74, 124, 89, 0.4);

/* Growing tree (score 40-79) */
--tree-sky-growing: linear-gradient(180deg, #B0C4DE 0%, #E8EAE6 100%);
--tree-ground-growing: #8B9A6B;

/* Struggling tree (score 0-39) */
--tree-sky-struggling: linear-gradient(180deg, #9E9E9E 0%, #D7CCC8 100%);
--tree-ground-struggling: #8D6E63;
--tree-glow-struggling: rgba(156, 75, 75, 0.4);
```

## Typography

### Fonts
- **Headings**: `Newsreader` (Google Fonts) — serif, warm, vintage feel
- **Body**: `Inter` (Google Fonts) — sans-serif, clean, highly readable
- **Fallback stack**: `system-ui, -apple-system, sans-serif`

### Scale
| Element | Font | Weight | Size | Line Height |
|---------|------|--------|------|-------------|
| h1 | Newsreader | 700 | 2.25rem (36px) | 1.2 |
| h2 | Newsreader | 600 | 1.75rem (28px) | 1.3 |
| h3 | Newsreader | 600 | 1.375rem (22px) | 1.4 |
| body | Inter | 400 | 0.9375rem (15px) | 1.6 |
| body-sm | Inter | 400 | 0.8125rem (13px) | 1.5 |
| label | Inter | 500 | 0.75rem (12px) | 1.4 |
| stat-number | Newsreader | 700 | 3rem (48px) | 1.1 |
| caption | Inter | 400 | 0.6875rem (11px) | 1.4 |

## Component Patterns

### Cards
- Background: `var(--card)` with `1px solid var(--border)`
- Border radius: `12px`
- Padding: `20px`
- Shadow: `0 1px 3px rgba(74, 63, 53, 0.08)`
- Hover: subtle lift `translateY(-1px)` + shadow increase

### Buttons
- **Primary**: `var(--primary)` bg, `var(--primary-fg)` text, `8px` radius
- **Secondary**: `var(--secondary)` bg, `var(--secondary-fg)` text
- **Ghost**: transparent bg, `var(--fg)` text, border on hover
- All buttons: `500` weight, `0.8125rem` size, `40px` min-height

### Inputs
- Background: `var(--card)`
- Border: `1px solid var(--input)`
- Border radius: `8px`
- Padding: `10px 14px`
- Focus: `2px solid var(--ring)` outline

### Badges
- Border radius: `9999px` (pill)
- Padding: `2px 10px`
- Font: Inter 500, `0.6875rem`
- Positive badge: `var(--success-light)` bg, `var(--success)` text
- Negative badge: `var(--danger-light)` bg, `var(--danger)` text

## Visual Effects

### 1. Dotted Surface Background (Dashboard — Habit Tracking Area)
**Inspiration**: [efferd/dotted-surface](https://21st.dev/community/components/efferd/dotted-surface/default)
- CSS radial-gradient dots on the habit section background
- Subtle animation: slight scale/opacity pulse
- Color: `var(--border)` dots on `var(--bg)` background
- Purpose: adds depth and texture to the main interaction area

### 2. CSS Smoke/Glow Effect (Tree Page)
**Inspiration**: [easemize/spooky-smoke](https://21st.dev/community/components/easemize/spooky-smoke-animation/default)
- CSS-only radial gradient glow behind the tree canvas
- **Healthy**: green glow (`var(--success-glow)`) — soft, warm, alive
- **Unhealthy**: red glow (`var(--danger-glow)`) — dim, ominous
- Animated with `@keyframes` — slow pulsing opacity/scale
- Implementation: pseudo-element (`::before`) on tree container

### 3. Background Pattern (Analytics Page)
**Inspiration**: [efferd/bg-pattern](https://21st.dev/community/components/efferd/bg-pattern/default)
- CSS linear-gradient grid pattern behind analytics charts
- Very subtle — opacity 0.03-0.05
- Adds visual texture without distraction

### 4. Minimal Auth Page
**Inspiration**: [efferd/minimal-auth-page](https://21st.dev/community/components/efferd/minimal-auth-page/default)
- Centered card on parchment background
- Social login buttons (Google) prominent at top
- "OR CONTINUE WITH" divider with horizontal lines
- Clean form fields with vintage styling
- Subtle background dots

### 5. Tooltip Navigation
**Inspiration**: [originui/popover/tooltip-like-with-nav](https://21st.dev/community/components/originui/popover/tooltip-like-with-nav)
- Popover menu style for settings/profile
- Arrow pointer, rounded corners
- Dropdown with navigation items
- Smooth fade-in animation

## Micro-Animations

```css
/* Standard animations used throughout */
@keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
@keyframes slideUp { from { transform: translateY(12px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
@keyframes scaleBounce { 0% { transform: scale(1) } 50% { transform: scale(1.05) } 100% { transform: scale(1) } }
@keyframes glowPulse { 0%, 100% { opacity: 0.3 } 50% { opacity: 0.6 } }
@keyframes shimmer { 0% { background-position: -200% } 100% { background-position: 200% } }
```

- **Habit toggle**: `scaleBounce` (200ms) + color transition (300ms ease)
- **Card entrance**: `slideUp` with staggered delay (50ms per card)
- **Page transitions**: `fadeIn` (200ms)
- **Tree glow**: `glowPulse` (3s infinite)
- **Streak fire**: `glowPulse` (1.5s infinite) on flame emoji

## Tree Gamification States

| Health | State Name | Trunk | Branches | Leaves | Extras | Atmosphere |
|--------|-----------|-------|----------|--------|--------|------------|
| 80-100 | 🌳 Flourishing | Thick, brown | Many, spreading | Full, bright green | Flowers, fruits, butterflies, sparkles | Blue sky, sunshine, green glow |
| 60-79 | 🌲 Healthy | Medium, brown | Good count | Medium green | Some flowers, a bird | Light blue sky, gentle glow |
| 40-59 | 🌿 Growing | Thin, light brown | Moderate | Sparse, light green | Small buds | Neutral sky |
| 20-39 | 🥀 Struggling | Thin, grey-brown | Few, thin | Few, yellow-brown | Bugs circling | Overcast, dim |
| 0-19 | 🪵 Dying | Very thin, grey | Bare, sparse | None/dead | Rotten fruit, insect swarm | Dark, grey, red glow |

### Tree Health Calculation
```
dailyScore = (completed positive habits) + (non-completed negative habits)
           - (missed positive habits) - (completed negative habits)

treeHealth = rolling 7-day weighted average, normalized to 0-100
// More recent days are weighted higher
```

## Responsive Breakpoints
```css
/* Mobile-first approach */
/* Base: 375px+ (default) */
@media (min-width: 480px) { /* Large phone */ }
@media (min-width: 768px) { /* Tablet */ }
@media (min-width: 1024px) { /* Desktop */ }
```

## Inspiration Sources
- **Theme**: [21st.dev vintage-paper](https://21st.dev/community/themes/vintage-paper)
- **BG Pattern**: [efferd/bg-pattern](https://21st.dev/community/components/efferd/bg-pattern/default)
- **Smoke/Glow**: [easemize/spooky-smoke](https://21st.dev/community/components/easemize/spooky-smoke-animation/default)
- **Dotted Surface**: [efferd/dotted-surface](https://21st.dev/community/components/efferd/dotted-surface/default)
- **Auth Page**: [efferd/minimal-auth-page](https://21st.dev/community/components/efferd/minimal-auth-page/default)
- **Tooltip**: [originui/popover/tooltip-like-with-nav](https://21st.dev/community/components/originui/popover/tooltip-like-with-nav)
- **Tree Apps**: Forest, Flora, Habits Tree
