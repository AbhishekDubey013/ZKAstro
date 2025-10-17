# Design Guidelines: Western Astrology Daily Prediction Platform

## Design Approach

**Selected Approach**: Hybrid System + Reference-Based
- **Primary System**: Material Design principles for data-dense components and clear hierarchy
- **Reference Inspiration**: Co-Star app (modern astrology UX), Linear (clean data presentation), Stripe (trust-building minimalism)
- **Rationale**: This utility-focused platform requires clear data presentation with subtle celestial aesthetics that build trust without overwhelming the core prediction functionality.

## Core Design Principles

1. **Data Clarity First**: Astrological data and predictions must be immediately scannable
2. **Subtle Mysticism**: Celestial elements support but don't dominate the interface
3. **Comparison-Friendly**: Side-by-side agent predictions need clear visual separation
4. **Trust Through Simplicity**: Clean, professional aesthetic builds confidence in predictions

## Color Palette

### Dark Mode (Primary)
- **Background Base**: 240 8% 8% (deep space navy-black)
- **Surface Elevated**: 240 10% 12% (card backgrounds)
- **Primary Accent**: 265 85% 65% (cosmic purple - for CTAs, active states)
- **Secondary Accent**: 190 75% 55% (celestial teal - for highlights, scores)
- **Text Primary**: 0 0% 95% (near-white)
- **Text Secondary**: 240 5% 65% (muted gray)
- **Success/High Score**: 155 70% 50% (emerald for 70+ day scores)
- **Warning/Medium Score**: 35 90% 60% (amber for 40-69 scores)
- **Danger/Low Score**: 0 75% 60% (soft red for <40 scores)

### Light Mode
- **Background Base**: 240 20% 97%
- **Surface Elevated**: 0 0% 100%
- **Primary Accent**: 265 70% 55%
- **Secondary Accent**: 190 65% 45%
- **Text Primary**: 240 10% 15%
- **Text Secondary**: 240 5% 45%

## Typography

**Font Families**:
- **Headlines/UI**: "Inter" (Google Fonts) - clean, modern, excellent readability
- **Data/Numbers**: "JetBrains Mono" (Google Fonts) - monospace for astrological degrees, scores
- **Accent/Mystical**: "Cormorant Garamond" (Google Fonts) - serif for agent names, mystical touches

**Hierarchy**:
- Hero/Page Titles: text-4xl md:text-5xl font-bold tracking-tight
- Section Headers: text-2xl font-semibold
- Card Titles: text-lg font-medium
- Body Text: text-base leading-relaxed
- Data Labels: text-sm font-medium uppercase tracking-wide text-secondary
- Scores/Numbers: font-mono text-2xl font-bold

## Layout System

**Spacing Units**: Tailwind primitives of 4, 6, 8, 12, 16, 24
- Component padding: p-6 (cards), p-8 (sections)
- Vertical rhythm: space-y-6 (compact), space-y-8 (standard), space-y-12 (generous)
- Container max-width: max-w-7xl for main content, max-w-4xl for forms

**Grid Strategy**:
- Landing form: Single column, centered max-w-2xl
- Chart summary: Single column data cards
- Prediction comparison: 2-column grid (lg:grid-cols-2) with gap-6
- Agents leaderboard: Single column with ranked cards

## Component Library

### Core UI Elements

**Cards**:
- Prediction cards: Elevated surface with subtle border (border-white/5), rounded-xl, p-6
- Agent cards: Include avatar placeholder, handle (@auriga), reputation badge
- Chart data cards: Grouped planetary positions with degree notation

**Buttons**:
- Primary CTA: bg-primary hover:bg-primary/90, rounded-lg px-6 py-3
- Secondary: variant="outline" with border-primary/20
- Selection buttons (choose prediction): Full-width, prominent with checkmark icon on select

**Data Display**:
- Day Score: Large circular progress indicator with score centered (0-100)
- Planetary positions: Table-like layout with planet symbols (use Unicode: ☉☽☿♀♂♃♄), degrees in monospace
- Aspects: Compact badges with aspect symbols (□ ⚹ △ ⚺)

**Forms**:
- Date/Time pickers: Native HTML inputs styled with dark mode support
- Location input: Grouped lat/lon fields or place search (if implemented)
- Timezone: Dropdown with common zones

### Navigation
- Minimal top nav: Logo + Agents link + Auth status
- Breadcrumbs on detail pages (Chart > Request)

### Data Displays
- Reputation badges: Pill-shaped with count, gradient from primary to secondary
- Status indicators: "OPEN" / "ANSWERED" / "SETTLED" with appropriate colors
- Factor tags: Small chips displaying "Moon trine Sun", "Mercury retro" etc.

### Overlays
- Loading states: Skeleton loaders matching card structure
- Success modal: After agent selection, show reputation change animation

## Visual Treatments

### Celestial Aesthetics (Subtle)
- Faint constellation dot patterns in page backgrounds (opacity: 0.02)
- Subtle radial gradient on hero section (from purple/20 to transparent)
- Agent avatars: Circular with soft glow effect (box-shadow with primary color)
- Day score circles: Gradient stroke from score-color to transparent

### Depth & Hierarchy
- Card elevation: 1-2px subtle shadow, stronger on hover
- Section separation: 1px border-top with low opacity dividers
- Z-index layers: Modals (50) > Dropdowns (40) > Cards (10) > Base (0)

### Micro-interactions
- Agent selection: Smooth scale on hover (scale-105), selected state with checkmark
- Score reveal: Gentle fade-in with count-up animation on mount
- Reputation change: +1 badge animation on selection

## Page-Specific Guidelines

### Landing (Chart Creation)
- Centered form (max-w-2xl)
- Hero headline: "Discover Your Daily Cosmic Guidance"
- Form fields stacked vertically with clear labels
- Prominent "Generate Chart" CTA
- Optional: Faint planetary orbit illustration in background

### Chart Summary (/chart/[id])
- Breadcrumb: Home > Chart
- Planet positions in organized card (Sun through Saturn)
- Ascendant/MC prominently displayed
- "Request Prediction" CTA centered below data
- Date selector for target prediction date

### Prediction Results (/request/[id])
- Question displayed at top in larger text
- Target date clearly shown
- Two-column comparison grid (stacks on mobile)
- Each agent card contains:
  - Agent handle with reputation badge
  - Day score (large, circular)
  - Summary (2-3 paragraphs)
  - Highlights (bulleted)
  - Factors (tags/chips)
  - "Choose This Prediction" button
- After selection: Disable both buttons, highlight chosen card

### Agents Leaderboard (/agents)
- Ranked list of agent cards
- Show: rank number, handle, method, reputation count
- Sortable by reputation (default)
- Active status indicator

## Responsive Behavior

**Mobile (< 768px)**:
- Single column throughout
- Prediction cards stack vertically
- Reduced padding (p-4 instead of p-6)
- Bottom-fixed CTA buttons on prediction selection

**Tablet (768px - 1024px)**:
- Maintain 2-column prediction comparison
- Slightly reduced max-widths

**Desktop (> 1024px)**:
- Full layout with generous spacing
- Max content width for optimal reading

## Images

**Hero Section**: No large hero image for landing. The form is the primary focus with subtle background treatment.

**Agent Avatars**: Abstract cosmic/constellation themed placeholder images (can use gradient orbs initially)
- Size: 48x48px on cards, 64x64px on agent page
- Style: Circular with soft glow
- Placement: Top-left of agent prediction cards, left of agent name on leaderboard

**Background Patterns**: 
- Subtle star field pattern (opacity: 0.02) on main background
- Constellation line art (very faint) on prediction comparison page
- No prominent imagery - keep focus on data

## Accessibility

- High contrast text (WCAG AAA where possible)
- Form labels clearly associated with inputs
- Keyboard navigation for prediction selection
- Loading states announced to screen readers
- Color not sole indicator (use icons + text for scores)